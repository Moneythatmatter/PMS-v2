"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Calendar,
  FileSpreadsheet,
  Filter,
  Loader2,
  BookOpen,
  ChevronDown,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  FormField,
  Drawer,
  Modal,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  accCompanyService,
  accReportService,
  accVoucherService,
  type GeneralLedgerEntry,
} from "@/services/accounts";
import { useAccLookups, useAccQuery, fyStartIso, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const ALL = "<ALL>";

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function GeneralLedgerView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Search Modal for Ledger Selection
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");

  // Voucher Detail Drill-Down Modal State (Read-Only)
  const [selectedEntry, setSelectedEntry] = useState<GeneralLedgerEntry | null>(null);

  // Primary Selection Controls (ID-based / Group-based)
  const [selectedGroup, setSelectedGroup] = useState(ALL);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedPartyId, setSelectedPartyId] = useState(ALL);
  const [selectedDivisionId, setSelectedDivisionId] = useState(ALL);
  const [selectedVoucherType, setSelectedVoucherType] = useState(ALL);

  // Date Range Controls
  const fyStart = fyStartIso();
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate, setToDate] = useState(todayIso());
  const [appliedFromDate, setAppliedFromDate] = useState(fyStart);
  const [appliedToDate, setAppliedToDate] = useState(todayIso());
  const [datePreset, setDatePreset] = useState("fy");
  const [sortOn, setSortOn] = useState<"vouchDt" | "vouchNo">("vouchDt");

  // Report display options (lean V1)
  const [cummulativeBalance, setCummulativeBalance] = useState(true);
  const [showCompanyHeading, setShowCompanyHeading] = useState(true);
  const [showDrTrn, setShowDrTrn] = useState(true);
  const [showCrTrn, setShowCrTrn] = useState(true);
  const [suppressZero, setSuppressZero] = useState(false);

  // Search filter query (searches Voucher #, Particulars, Party, Account, Division)
  const [searchQuery, setSearchQuery] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();
  const accounts = useMemo(() => lookups?.accounts ?? [], [lookups]);
  const groupAccounts = useMemo(() => accounts.filter((a) => a.accountType === "Group"), [accounts]);

  const currentFy = useMemo(() => {
    const fys = lookups?.fiscalYears ?? [];
    return (
      fys.find((f) => f.startDate <= appliedToDate && f.endDate >= appliedToDate) ??
      fys.find((f) => f.isCurrent) ??
      null
    );
  }, [lookups, appliedToDate]);

  // Effective account filter: a specific ledger wins over the group
  const effectiveAccountId = selectedAccountId || (selectedGroup !== ALL ? selectedGroup : "");
  const effectivePartyId = selectedPartyId !== ALL ? selectedPartyId : "";
  const hasSelection = Boolean(effectiveAccountId || effectivePartyId);

  const report = useAccQuery(
    () =>
      hasSelection
        ? accReportService.generalLedger({
            accountId: effectiveAccountId || undefined,
            partyId: effectivePartyId || undefined,
            divisionId: selectedDivisionId !== ALL ? selectedDivisionId : undefined,
            voucherTypeId: selectedVoucherType !== ALL ? selectedVoucherType : undefined,
            from: appliedFromDate,
            to: appliedToDate,
          })
        : Promise.resolve(null),
    [effectiveAccountId, effectivePartyId, selectedDivisionId, selectedVoucherType, appliedFromDate, appliedToDate]
  );

  const voucherDetail = useAccQuery(
    () => (selectedEntry ? accVoucherService.get(selectedEntry.voucherId) : Promise.resolve(null)),
    [selectedEntry?.voucherId]
  );

  const companyQuery = useAccQuery(
    () => (showCompanyHeading ? accCompanyService.list() : Promise.resolve([])),
    [showCompanyHeading]
  );
  const company = companyQuery.data?.find((c) => c.status === "Active") ?? companyQuery.data?.[0] ?? null;

  // Active selected account object
  const activeAccount = useMemo(() => {
    if (!effectiveAccountId) return null;
    return accounts.find((l) => l.id === effectiveAccountId) || null;
  }, [accounts, effectiveAccountId]);
  const activeParty = useMemo(
    () => lookups?.parties.find((p) => p.id === effectivePartyId) ?? null,
    [lookups, effectivePartyId]
  );

  const selectionLabel = activeAccount
    ? `${activeAccount.code} - ${activeAccount.name}${activeParty ? ` / ${activeParty.partyName}` : ""}`
    : activeParty
    ? `Party: ${activeParty.partyName}`
    : "No ledger selected";

  // Preset Date Range Selector
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = todayIso();
    let newFrom = fyStart;
    let newTo = today;
    if (preset === "q1") {
      newTo = addMonths(fyStart, 3);
    } else if (preset === "thisMonth") {
      newFrom = `${today.slice(0, 7)}-01`;
    }
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Trigger Display Action
  const handleDisplayReport = () => {
    if (toDate < fromDate) {
      setToastMessage("'To' date must be on or after 'From' date.");
      return;
    }
    if (!hasSelection) {
      setToastMessage("Select a group, ledger account or party to display the ledger.");
      return;
    }
    if (fromDate === appliedFromDate && toDate === appliedToDate) {
      void report.reload();
    } else {
      setAppliedFromDate(fromDate);
      setAppliedToDate(toDate);
    }
  };

  // Filtered Ledger Data
  const filteredData = useMemo(() => {
    const entries = report.data?.entries ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = entries.filter((item) => {
      // DR / CR Trn Filters
      if (!showDrTrn && item.debit > 0) return false;
      if (!showCrTrn && item.credit > 0) return false;

      // Suppress Zero Filter
      if (suppressZero && item.debit === 0 && item.credit === 0) return false;

      // Global Search Filter (Voucher #, Particulars, Party, Account, Division)
      if (q) {
        const haystack = [
          item.voucherNo,
          item.particulars,
          item.narration,
          item.accountName,
          item.partyName,
          item.divisionName,
          item.referenceNo,
          item.chequeNo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
    if (sortOn === "vouchNo") {
      return [...list].sort((a, b) => a.voucherNo.localeCompare(b.voucherNo, undefined, { numeric: true }));
    }
    return list;
  }, [report.data, showDrTrn, showCrTrn, suppressZero, searchQuery, sortOn]);

  // Dynamic Total Calculations (for the visible rows)
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.totalDr += item.debit;
        acc.totalCr += item.credit;
        return acc;
      },
      { totalDr: 0, totalCr: 0 }
    );
  }, [filteredData]);

  const opening = report.data?.opening ?? null;
  const closing = report.data?.closing ?? null;

  // Filtered Ledgers for Modal Search (restricted to the selected group's subtree)
  const filteredModalLedgers = useMemo(() => {
    let scope = accounts;
    if (selectedGroup !== ALL) {
      const inScope = new Set<string>([selectedGroup]);
      let added = true;
      while (added) {
        added = false;
        for (const a of accounts) {
          if (a.parentId && inScope.has(a.parentId) && !inScope.has(a.id)) {
            inScope.add(a.id);
            added = true;
          }
        }
      }
      scope = accounts.filter((a) => inScope.has(a.id));
    }
    const q = ledgerSearchQuery.toLowerCase();
    return scope.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.category ?? "").toLowerCase().includes(q)
    );
  }, [accounts, selectedGroup, ledgerSearchQuery]);

  // Badge Color Helper for Transaction Types
  const getTrnTypeBadgeClass = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("receipt")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (t.includes("payment")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (t.includes("journal")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (t.includes("opening")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // ─────────────────────────────────────────────────────────────
  // CLEAN EXCEL-READY CSV EXPORT
  // ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!report.data) {
      setToastMessage("Nothing to export yet — select a ledger and display the report first.");
      return;
    }
    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const headers = [
      "VOUCHER DATE",
      "VOUCHER NO",
      "PARTICULARS",
      "PARTY",
      "DIVISION",
      "ACCOUNT NAME",
      "TYPE",
      "DR AMOUNT (INR)",
      "CR AMOUNT (INR)",
      "RUNNING BALANCE",
    ];

    const dataRows: (string | number)[][] = [];
    if (opening) {
      dataRows.push([
        report.data.from,
        "",
        "OPENING BALANCE",
        "",
        "",
        "",
        "Opening",
        opening.side === "Dr" ? opening.amount : 0,
        opening.side === "Cr" ? opening.amount : 0,
        `${opening.amount} ${opening.side}`,
      ]);
    }
    filteredData.forEach((r) => {
      dataRows.push([
        r.voucherDate,
        r.voucherNo,
        r.particulars,
        r.partyName ?? "",
        r.divisionName ?? "",
        r.accountName ?? "",
        r.voucherType,
        r.debit,
        r.credit,
        `${r.balance} ${r.balanceSide}`,
      ]);
    });

    // Totals Row
    dataRows.push([
      "TOTALS",
      "GRAND TOTAL",
      "GENERAL LEDGER POSTINGS",
      "",
      "",
      "",
      "",
      totals.totalDr,
      totals.totalCr,
      closing ? `${closing.amount} ${closing.side}` : "",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...dataRows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PMS_General_Ledger_${appliedFromDate}_to_${appliedToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectClass =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium";

  // Shared Filter Controls Component
  const filterFormContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Group, Ledger & Voucher Type Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
          Account & Voucher Selection
        </p>

        {lookupsError && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">
            <span className="truncate">{lookupsError}</span>
            <button type="button" onClick={() => void reloadLookups(true)} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Group Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Account Group:</label>
          <select
            value={selectedGroup}
            disabled={lookupsLoading}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedAccountId(""); // Reset specific account when switching group
            }}
            className={selectClass}
          >
            <option value={ALL}>{lookupsLoading ? "Loading…" : "<ALL>"}</option>
            {groupAccounts.map((grp) => (
              <option key={grp.id} value={grp.id}>
                {grp.code} - {grp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Selector with Search Modal */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Specific Ledger Account:</label>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 h-8 flex items-center">
              {selectedAccountId && activeAccount ? (
                <span className="truncate">
                  <strong className="text-emerald-700">{activeAccount.code}</strong> - {activeAccount.name}
                </span>
              ) : (
                <span className="text-slate-400">
                  {selectedGroup !== ALL ? "All Ledgers in Group" : "Select a ledger…"}
                </span>
              )}
            </div>
            {selectedAccountId && (
              <button
                type="button"
                onClick={() => setSelectedAccountId("")}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
                title="Clear selected account"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(true)}
              className="h-8 px-2.5 border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Lookup Account"
            >
              <Search className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold">Find</span>
            </Button>
          </div>
        </div>

        {/* Party Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Party:</label>
          <select
            value={selectedPartyId}
            disabled={lookupsLoading}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>{"<ALL>"}</option>
            {(lookups?.parties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.partyCode} - {p.partyName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Voucher Type Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Voucher Type:</label>
            <select
              value={selectedVoucherType}
              disabled={lookupsLoading}
              onChange={(e) => setSelectedVoucherType(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>{"<ALL>"}</option>
              {(lookups?.voucherTypes ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.voucherTypeName}
                </option>
              ))}
            </select>
          </div>

          {/* Division Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Division:</label>
            <select
              value={selectedDivisionId}
              disabled={lookupsLoading}
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              className={selectClass}
            >
              <option value={ALL}>{"<ALL>"}</option>
              {(lookups?.divisions ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.divisionName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Box 2: Report & Display Options */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          Report & Display Options
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={cummulativeBalance}
              onChange={(e) => setCummulativeBalance(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Cumulative Bal</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Company Heading</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showDrTrn}
              onChange={(e) => setShowDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">DR Postings</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCrTrn}
              onChange={(e) => setShowCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">CR Postings</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={suppressZero}
              onChange={(e) => setSuppressZero(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Suppress Zero Amount Lines</span>
          </label>
        </div>
      </div>

      {/* Box 3: Period & Sorting */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period & Sorting
        </p>

        {/* Date Presets */}
        <div className="flex items-center gap-1">
          {[
            { id: "fy", label: "FY to Date" },
            { id: "q1", label: "Q1 Apr-Jun" },
            { id: "thisMonth", label: "This Month" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDatePreset(p.id)}
              className={cn(
                "flex-1 rounded-lg py-1 text-[11px] font-semibold transition-all border cursor-pointer select-none",
                datePreset === p.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dates Row & Display Button */}
        <div className="flex flex-wrap items-end gap-2 pt-0.5">
          <FormField label="From Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
            />
          </FormField>

          <FormField label="To Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={toDate}
              onChange={(val) => setToDate(val)}
            />
          </FormField>

          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={report.loading && hasSelection}
            className="h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 shadow-2xs shrink-0 disabled:opacity-75 cursor-pointer rounded-lg"
          >
            {report.loading && hasSelection ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>

        {/* Sorting Touch Pills */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Sort On:</span>
          <div className="flex items-center gap-1.5 font-medium">
            {[
              { id: "vouchDt", label: "Voucher Date" },
              { id: "vouchNo", label: "Voucher #" },
            ].map((opt) => {
              const active = sortOn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOn(opt.id as typeof sortOn)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const detail = voucherDetail.data;

  return (
    <ModulePageShell
      eyebrow="Accounts &amp; General Ledger"
      title="General Ledger Report"
      description="Voucher-level account transactions, debit/credit postings, and running balances."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs hidden sm:inline-flex cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            disabled={!report.data}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs cursor-pointer px-3.5"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      }
      wrapChildren={false}
    >
      {/* Top Filter Controls Toolbar Bar */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "rounded-lg border-slate-200 text-xs font-semibold gap-1.5 transition-all hidden md:inline-flex cursor-pointer shadow-2xs",
              showFilters ? "bg-slate-100 text-slate-900 border-slate-300" : "text-slate-700 bg-white hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>{showFilters ? "Hide Report Controls" : "Report Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Mobile Filter Drawer Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-lg border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Selected Ledger Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
            Active Ledger:{" "}
            <span className="underline">{selectionLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {currentFy ? currentFy.fiscalYearName : `${formatDate(appliedFromDate)} – ${formatDate(appliedToDate)}`}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4 hidden md:block">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                General Ledger Selection Parameters
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Hide Filters
            </button>
          </div>
          {filterFormContent}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="General Ledger Options"
      >
        <div className="p-4 space-y-4">
          {filterFormContent}
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Ledger Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Standard Vertical KPI Cards Grid (F&B / Front Office Style) */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Total Debit Postings */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Debit Postings (DR)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totals.totalDr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Total period debit postings
          </p>
        </Card>

        {/* Card 2: Total Credit Postings */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Credit Postings (CR)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {formatINR(totals.totalCr)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Total period credit postings
          </p>
        </Card>

        {/* Card 3: Closing Running Balance */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Closing Running Balance
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate font-mono">
            {closing ? `${formatINR(closing.amount)} ${closing.side}` : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold sm:text-xs truncate">
            {opening ? `Opening: ${formatINR(opening.amount)} ${opening.side}` : ""}
            {report.data?.account ? ` · Nature: ${report.data.account.nature}` : ""}
          </p>
        </Card>
      </div>

      {/* Company Heading Block */}
      {showCompanyHeading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-2xs">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {company ? company.legalName || company.tradeName : companyQuery.loading ? "Loading company…" : "Company not configured"}
          </h1>
          {company && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {[company.addressLine1, company.city, company.state].filter(Boolean).join(", ")}
              {company.gstNumber ? ` • GSTIN: ${company.gstNumber}` : ""}
            </p>
          )}
          <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
          <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            GENERAL LEDGER STATEMENT{hasSelection ? ` — ${selectionLabel.toUpperCase()}` : ""}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            For the Period: <span className="font-semibold text-slate-700">{formatDate(appliedFromDate)}</span> to{" "}
            <span className="font-semibold text-slate-700">{formatDate(appliedToDate)}</span>
          </p>
        </div>
      )}

      {/* Account Lookup Modal */}
      <Modal
        open={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        title="Chart of Accounts - Ledger Lookup"
      >
        <div className="space-y-3 p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              placeholder="Search by account code, name, or category..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-2xs">
            {lookupsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading accounts…</div>
            ) : filteredModalLedgers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No accounts match your search.</div>
            ) : (
              filteredModalLedgers.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setLedgerModalOpen(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2 text-left text-xs font-medium transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer",
                    selectedAccountId === acc.id ? "bg-slate-100 font-bold text-slate-900" : "text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">{acc.code}</span>
                    <span className={acc.accountType === "Group" ? "font-bold" : undefined}>{acc.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({acc.accountType === "Group" ? "Group" : acc.category || acc.nature})
                    </span>
                  </div>
                  {selectedAccountId === acc.id && (
                    <span className="text-[10px] uppercase font-bold text-slate-900">Selected</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Read-Only Voucher Detail Modal (Drill-Down) */}
      <Modal
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title={`Voucher Inquiry: ${selectedEntry?.voucherNo || ""}`}
      >
        {selectedEntry && (
          <div className="space-y-4 p-1">
            {/* Read-Only Notice */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200">
              <Eye className="h-4 w-4 text-emerald-700" />
              <span>General Ledger Inquiry (Strictly Read-Only Transaction Breakdown)</span>
            </div>

            {voucherDetail.loading && !detail ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading voucher…
              </div>
            ) : voucherDetail.error || !detail ? (
              <div className="py-6 text-center text-xs">
                <p className="font-semibold text-rose-700">{voucherDetail.error ?? "Voucher not found."}</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void voucherDetail.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {/* Voucher Meta Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Number</span>
                    <span className="font-bold text-slate-900 font-mono">{detail.voucherNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Date</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatDate(detail.voucherDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Type</span>
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider mt-0.5",
                        getTrnTypeBadgeClass(detail.voucherTypeName ?? detail.voucherCategory)
                      )}
                    >
                      {detail.voucherTypeName ?? detail.voucherCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Source Module</span>
                    <span className="font-semibold text-emerald-800">{detail.sourceModule || "—"}</span>
                  </div>
                </div>

                {/* PMS Dimensions (Party & Division) */}
                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Party</span>
                    <span className="font-bold text-slate-900">{detail.partyName ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Division / Cost Center</span>
                    <span className="font-bold text-slate-900">{detail.divisionName ?? "—"}</span>
                  </div>
                </div>

                {/* Narration */}
                <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1 text-xs shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Particulars / Narration</span>
                  <p className="font-medium text-slate-800">{detail.narration || selectedEntry.particulars || "—"}</p>
                </div>

                {/* Accounting Distribution Breakdown Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="px-3 py-2">Side</th>
                        <th className="px-3 py-2">Account</th>
                        <th className="px-3 py-2 text-right">Debit (₹)</th>
                        <th className="px-3 py-2 text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {detail.lines.map((line) => (
                        <tr key={line.id}>
                          <td className={cn("px-3 py-2 font-bold", line.debit > 0 ? "text-sky-700" : "text-rose-700")}>
                            {line.debit > 0 ? "Dr" : "Cr"}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            <span className="font-mono text-slate-500 mr-1.5">{line.accountCode}</span>
                            {line.accountName}
                            {line.partyName && <span className="text-[10px] text-slate-400"> · {line.partyName}</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold font-mono text-slate-900">
                            {line.debit > 0 ? formatINR(line.debit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold font-mono text-slate-900">
                            {line.credit > 0 ? formatINR(line.credit) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Audit Stamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Prepared By: <strong>{detail.preparedBy ?? "—"}</strong></span>
                  <span>Status: <strong>{detail.status}</strong></span>
                  <span>Created: <strong>{formatDate(detail.createdAt)}</strong></span>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntry(null)}
                className="text-xs font-semibold"
              >
                Close Inquiry
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Main General Ledger Table Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        {/* Table Search Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                General Ledger Transactions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Click or tap any voucher row to view accounting distribution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voucher #, particulars, party..."
                className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shrink-0">
              {filteredData.length} postings
            </span>
          </div>
        </div>

        {!hasSelection ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Select a ledger to view postings</p>
            <p className="text-xs text-slate-500 mt-1">
              Choose an account group, a specific ledger account or a party in the report parameters.
            </p>
          </div>
        ) : report.loading && !report.data ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            Loading ledger postings…
          </div>
        ) : report.error ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Could not load general ledger</p>
            <p className="text-xs text-slate-500 mt-1">{report.error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void report.reload()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <>
            {filteredData.length === 0 && (
              <div className="mb-3 py-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                {(report.data?.entries.length ?? 0) === 0
                  ? "No postings for this selection in the chosen period."
                  : "No postings match your search / display filters."}
              </div>
            )}

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse table-auto">
                {/* Table Header */}
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-3 py-2.5 border-r border-slate-200 w-24">Vouch Dt</th>
                    <th className="px-3 py-2.5 border-r border-slate-200 w-32">Vouch No</th>
                    <th className="px-3.5 py-2.5 border-r border-slate-200 min-w-[200px]">Particulars</th>
                    <th className="px-3 py-2.5 border-r border-slate-200 w-36">Party</th>
                    <th className="px-3 py-2.5 border-r border-slate-200 w-28">Division</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-200 w-24 text-center">Type</th>
                    <th className="px-3 py-2.5 border-r border-slate-200 text-right w-28">DR Amount (₹)</th>
                    <th className="px-3 py-2.5 border-r border-slate-200 text-right w-28">CR Amount (₹)</th>
                    {cummulativeBalance && (
                      <th className="px-3 py-2.5 text-right w-32">Running Bal (₹)</th>
                    )}
                  </tr>
                </thead>

                {/* Table Rows */}
                <tbody className="divide-y divide-slate-100 bg-white">
                  {opening && (
                    <tr className="bg-amber-50/30 font-semibold">
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600 font-medium font-mono">
                        {formatDate(report.data?.from)}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-slate-800 font-mono">—</td>
                      <td className="px-3.5 py-2.5 border-r border-slate-100 font-semibold text-slate-900">
                        Opening Balance
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-700">—</td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600">—</td>
                      <td className="px-2.5 py-2.5 border-r border-slate-100 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                            getTrnTypeBadgeClass("Opening")
                          )}
                        >
                          Opening
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                        {opening.side === "Dr" && opening.amount > 0 ? formatINR(opening.amount) : "-"}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                        {opening.side === "Cr" && opening.amount > 0 ? formatINR(opening.amount) : "-"}
                      </td>
                      {cummulativeBalance && (
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-900 bg-slate-50/50">
                          {formatINR(opening.amount)} {opening.side}
                        </td>
                      )}
                    </tr>
                  )}
                  {filteredData.map((row) => (
                    <tr
                      key={row.lineId}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
                      onClick={() => setSelectedEntry(row)}
                    >
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600 font-medium font-mono">
                        {formatDate(row.voucherDate)}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 font-bold text-slate-800 font-mono">
                        {row.voucherNo}
                      </td>
                      <td className="px-3.5 py-2.5 border-r border-slate-100 font-semibold text-slate-900">
                        {row.particulars}
                        {row.narration && row.narration !== row.particulars && (
                          <span className="block text-[10px] font-normal text-slate-500">{row.narration}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-700 truncate max-w-[150px]">
                        {row.partyName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-slate-600 font-medium">
                        {row.divisionName ?? "—"}
                      </td>
                      <td className="px-2.5 py-2.5 border-r border-slate-100 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                            getTrnTypeBadgeClass(row.voucherType)
                          )}
                        >
                          {row.voucherTypeCode ?? row.voucherType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                        {row.debit > 0 ? formatINR(row.debit) : "-"}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-100 text-right font-mono font-medium text-slate-800">
                        {row.credit > 0 ? formatINR(row.credit) : "-"}
                      </td>
                      {cummulativeBalance && (
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-900 bg-slate-50/50">
                          {formatINR(row.balance)} {row.balanceSide}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300 text-slate-900 uppercase">
                    <td colSpan={6} className="px-4 py-2.5 text-right border-r border-slate-200 text-slate-900">
                      TOTAL GENERAL LEDGER POSTINGS:
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 text-slate-900">
                      {formatINR(totals.totalDr)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono border-r border-slate-200 text-slate-900">
                      {formatINR(totals.totalCr)}
                    </td>
                    {cummulativeBalance && (
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-950 font-bold bg-emerald-100/60">
                        {closing ? `${formatINR(closing.amount)} ${closing.side}` : "—"}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-3">
              {opening && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Opening Balance</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(opening.amount)} {opening.side}
                  </span>
                </div>
              )}
              {filteredData.map((row) => (
                <div
                  key={row.lineId}
                  onClick={() => setSelectedEntry(row)}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-mono">{row.voucherNo}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider",
                        getTrnTypeBadgeClass(row.voucherType)
                      )}
                    >
                      {row.voucherTypeCode ?? row.voucherType}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{row.particulars}</p>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Party</span>
                      <span className="font-medium truncate">{row.partyName ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Division</span>
                      <span className="font-medium">{row.divisionName ?? "—"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Voucher Date</span>
                      <span className="font-semibold font-mono">{formatDate(row.voucherDate)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Amount</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {row.debit > 0 ? `Dr ${formatINR(row.debit)}` : `Cr ${formatINR(row.credit)}`}
                      </span>
                    </div>
                  </div>

                  {cummulativeBalance && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-emerald-900 bg-emerald-50/50 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Running Balance:</span>
                      <span className="font-mono">{formatINR(row.balance)} {row.balanceSide}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </ModulePageShell>
  );
}
