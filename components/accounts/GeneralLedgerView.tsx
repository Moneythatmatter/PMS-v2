"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Printer,
  Search,
  CheckCircle2,
  Scale,
  Landmark,
  SlidersHorizontal,
  X,
  Filter,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  Drawer,
  Modal,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type GeneralLedgerEntry } from "@/services/accounts";
import { useAccLookups, useAccQuery, fyStartIso, todayIso, formatDate } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import { ExportMenu } from "@/components/accounts/ExportMenu";
import { KpiCard } from "@/components/accounts/KpiCard";
import { DataGrid, type GridColumn } from "@/components/accounts/DataGrid";
import { VoucherEditModal } from "./VoucherEditModal";

const ALL = "<ALL>";

const EXPORT_HEADER = [
  "Voucher Date",
  "Voucher No",
  "Particulars",
  "Party",
  "Division",
  "Account",
  "Type",
  "Debit (₹)",
  "Credit (₹)",
  "Running Balance",
];

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function GeneralLedgerView({
  initialAccountId,
  initialFromDate,
  initialToDate,
}: { initialAccountId?: string; initialFromDate?: string; initialToDate?: string } = {}) {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Search Modal for Ledger Selection
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");

  // Voucher opened in the edit modal
  const [selectedEntry, setSelectedEntry] = useState<GeneralLedgerEntry | null>(null);

  // Primary Selection Controls (ID-based / Group-based)
  const [selectedGroup, setSelectedGroup] = useState(ALL);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId ?? "");
  const [selectedPartyId, setSelectedPartyId] = useState(ALL);
  const [selectedDivisionId, setSelectedDivisionId] = useState(ALL);
  const [selectedVoucherType, setSelectedVoucherType] = useState(ALL);

  // Date Range Controls
  const fyStart = fyStartIso();
  const startFrom = initialFromDate ?? fyStart;
  const startTo = initialToDate ?? todayIso();
  const [fromDate, setFromDate] = useState(startFrom);
  const [toDate, setToDate] = useState(startTo);
  const [appliedFromDate, setAppliedFromDate] = useState(startFrom);
  const [appliedToDate, setAppliedToDate] = useState(startTo);
  const [datePreset, setDatePreset] = useState(initialFromDate || initialToDate ? "" : "fy");
  const [sortOn, setSortOn] = useState<"vouchDt" | "vouchNo">("vouchDt");

  // Report display options (lean V1)
  const [cummulativeBalance, setCummulativeBalance] = useState(true);
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
  const periodLabel = `${formatDate(appliedFromDate)} – ${formatDate(appliedToDate)}`;

  const exportRows = (): (string | number)[][] => {
    const rows: (string | number)[][] = [];
    if (opening) {
      rows.push([
        formatDate(report.data?.from),
        "",
        "Opening Balance",
        "",
        "",
        "",
        "Opening",
        opening.side === "Dr" ? opening.amount : 0,
        opening.side === "Cr" ? opening.amount : 0,
        `${opening.amount} ${opening.side}`,
      ]);
    }
    for (const r of filteredData) {
      rows.push([
        formatDate(r.voucherDate),
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
    }
    rows.push([
      "Total",
      "",
      `${filteredData.length} postings`,
      "",
      "",
      "",
      "",
      totals.totalDr,
      totals.totalCr,
      closing ? `${closing.amount} ${closing.side}` : "",
    ]);
    return rows;
  };

  const ensureExportable = () => {
    if (report.data) return true;
    setToastMessage("Nothing to export yet — select a ledger and display the report first.");
    return false;
  };

  const exportFileBase = `general-ledger-${appliedFromDate}-to-${appliedToDate}`;

  const handleExportExcel = () => {
    if (!ensureExportable()) return;
    downloadXlsx(`${exportFileBase}.xlsx`, [
      {
        name: "General Ledger",
        title: "General Ledger Statement",
        meta: [
          ["Ledger", selectionLabel],
          ["Period", periodLabel],
          ...(searchQuery.trim() ? [["Search", searchQuery.trim()] as [string, string]] : []),
          ["Opening", opening ? `${formatINR(opening.amount)} ${opening.side}` : "—"],
          ["Total Debit", totals.totalDr],
          ["Total Credit", totals.totalCr],
          ["Closing", closing ? `${formatINR(closing.amount)} ${closing.side}` : "—"],
          ["Generated", new Date().toLocaleString("en-IN")],
        ],
        header: EXPORT_HEADER,
        rows: exportRows(),
      },
    ]);
    setToastMessage(`Exported ${filteredData.length} postings to Excel.`);
  };

  const handleExportCsv = () => {
    if (!ensureExportable()) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [EXPORT_HEADER, ...exportRows()].map((r) => r.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileBase}.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const typeBadge = (type: string, label: string) => (
    <span
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        getTrnTypeBadgeClass(type)
      )}
    >
      {label}
    </span>
  );

  const ledgerColumns: GridColumn<GeneralLedgerEntry>[] = [
    {
      id: "date",
      label: "Vouch Dt",
      width: 105,
      cell: (row) => formatDate(row.voucherDate),
      cellClass: () => "tabular-nums text-slate-600",
      footer: "Total",
    },
    {
      id: "voucherNo",
      label: "Vouch No",
      width: 140,
      cell: (row) => row.voucherNo,
      cellClass: () => "font-semibold text-slate-900",
      footer: `${filteredData.length} postings`,
    },
    {
      id: "particulars",
      label: "Particulars",
      width: 280,
      cell: (row) =>
        row.narration && row.narration !== row.particulars ? (
          <>
            {row.particulars} <span className="text-slate-400">· {row.narration}</span>
          </>
        ) : (
          row.particulars
        ),
      cellClass: () => "text-slate-900",
      title: (row) => [row.particulars, row.narration].filter(Boolean).join(" — "),
    },
    {
      id: "party",
      label: "Party",
      width: 170,
      cell: (row) => row.partyName ?? "",
      title: (row) => row.partyName ?? undefined,
    },
    { id: "division", label: "Division", width: 120, cell: (row) => row.divisionName ?? "", cellClass: () => "text-slate-600" },
    {
      id: "type",
      label: "Type",
      width: 90,
      align: "center",
      cell: (row) => typeBadge(row.voucherType, row.voucherTypeCode ?? row.voucherType),
    },
    {
      id: "debit",
      label: "Debit (₹)",
      width: 130,
      align: "right",
      cell: (row) => (row.debit > 0 ? formatINR(row.debit) : ""),
      cellClass: () => "tabular-nums text-slate-800",
      footer: <span className="tabular-nums">{formatINR(totals.totalDr)}</span>,
    },
    {
      id: "credit",
      label: "Credit (₹)",
      width: 130,
      align: "right",
      cell: (row) => (row.credit > 0 ? formatINR(row.credit) : ""),
      cellClass: () => "tabular-nums text-slate-800",
      footer: <span className="tabular-nums">{formatINR(totals.totalCr)}</span>,
    },
    ...(cummulativeBalance
      ? [
          {
            id: "balance",
            label: "Running Bal (₹)",
            width: 150,
            align: "right",
            cell: (row) => `${formatINR(row.balance)} ${row.balanceSide}`,
            cellClass: () => "tabular-nums font-semibold text-emerald-900",
            footer: (
              <span className="tabular-nums text-emerald-900">
                {closing ? `${formatINR(closing.amount)} ${closing.side}` : "—"}
              </span>
            ),
          } satisfies GridColumn<GeneralLedgerEntry>,
        ]
      : []),
  ];

  const openingPinnedRows = opening
    ? [
        {
          key: "opening",
          className: "bg-amber-50/50",
          cells: {
            date: formatDate(report.data?.from),
            particulars: "Opening Balance",
            type: typeBadge("Opening", "Opening"),
            debit: opening.side === "Dr" && opening.amount > 0 ? formatINR(opening.amount) : "",
            credit: opening.side === "Cr" && opening.amount > 0 ? formatINR(opening.amount) : "",
            balance: `${formatINR(opening.amount)} ${opening.side}`,
          },
        },
      ]
    : undefined;

  const selectClass =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium";

  const fieldLabel = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-600";

  const displayToggles: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }[] = [
    { id: "cumulative", label: "Running balance", checked: cummulativeBalance, onChange: setCummulativeBalance },
    { id: "dr", label: "Debit postings", checked: showDrTrn, onChange: setShowDrTrn },
    { id: "cr", label: "Credit postings", checked: showCrTrn, onChange: setShowCrTrn },
    { id: "zero", label: "Hide zero lines", checked: suppressZero, onChange: setSuppressZero },
  ];

  // Shared Filter Controls Component
  const filterFormContent = (
    <div className="space-y-4">
      {lookupsError && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <span className="truncate">{lookupsError}</span>
          <button type="button" onClick={() => void reloadLookups(true)} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Row 1: what to report on */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_1fr_1fr]">
        <div>
          <label className={fieldLabel}>Account Group</label>
          <select
            value={selectedGroup}
            disabled={lookupsLoading}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedAccountId("");
            }}
            className={selectClass}
          >
            <option value={ALL}>{lookupsLoading ? "Loading…" : "All groups"}</option>
            {groupAccounts.map((grp) => (
              <option key={grp.id} value={grp.id}>
                {grp.code} - {grp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel}>Ledger Account</label>
          <div className="flex h-8 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-emerald-500">
            <button
              type="button"
              onClick={() => setLedgerModalOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 text-left text-xs font-medium cursor-pointer hover:bg-slate-50"
              title="Find ledger account"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {selectedAccountId && activeAccount ? (
                <span className="truncate text-slate-800">
                  <span className="font-semibold text-emerald-700">{activeAccount.code}</span> · {activeAccount.name}
                </span>
              ) : (
                <span className="truncate text-slate-400">
                  {selectedGroup !== ALL ? "All ledgers in group" : "Find a ledger…"}
                </span>
              )}
            </button>
            {selectedAccountId && (
              <button
                type="button"
                onClick={() => setSelectedAccountId("")}
                className="flex w-8 shrink-0 items-center justify-center border-l border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                title="Clear selected account"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Party</label>
          <select
            value={selectedPartyId}
            disabled={lookupsLoading}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>All parties</option>
            {(lookups?.parties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.partyCode} - {p.partyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel}>Voucher Type</label>
          <select
            value={selectedVoucherType}
            disabled={lookupsLoading}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>All types</option>
            {(lookups?.voucherTypes ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.voucherTypeName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel}>Division</label>
          <select
            value={selectedDivisionId}
            disabled={lookupsLoading}
            onChange={(e) => setSelectedDivisionId(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>All divisions</option>
            {(lookups?.divisions ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.divisionName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: period + display */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={fieldLabel}>Period</label>
          <div className="flex h-8 items-center rounded-lg border border-slate-300/70 bg-slate-200/70 p-0.5">
            {[
              { id: "fy", label: "FY to date" },
              { id: "q1", label: "Q1" },
              { id: "thisMonth", label: "This month" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePreset(p.id)}
                className={cn(
                  "h-full rounded-md px-2.5 text-[11px] font-semibold transition-colors cursor-pointer select-none",
                  datePreset === p.id ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-32">
          <label className={fieldLabel}>From</label>
          <FODatePicker
            value={fromDate}
            onChange={(val) => {
              setFromDate(val);
              setDatePreset("");
            }}
          />
        </div>
        <div className="w-32">
          <label className={fieldLabel}>To</label>
          <FODatePicker
            value={toDate}
            onChange={(val) => {
              setToDate(val);
              setDatePreset("");
            }}
          />
        </div>

        <div>
          <label className={fieldLabel}>Sort by</label>
          <div className="flex h-8 items-center rounded-lg border border-slate-300/70 bg-slate-200/70 p-0.5">
            {[
              { id: "vouchDt", label: "Date" },
              { id: "vouchNo", label: "Voucher #" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortOn(opt.id as typeof sortOn)}
                className={cn(
                  "h-full rounded-md px-2.5 text-[11px] font-semibold transition-colors cursor-pointer select-none",
                  sortOn === opt.id ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleDisplayReport}
          disabled={report.loading && hasSelection}
          className="h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 shadow-2xs disabled:opacity-75 cursor-pointer"
        >
          {report.loading && hasSelection ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5 mr-1" />
          )}
          Display
        </Button>

        <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Show</span>
          {displayToggles.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.checked}
              onClick={() => t.onChange(!t.checked)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer select-none",
                t.checked
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              )}
            >
              <CheckCircle2 className={cn("h-3.5 w-3.5", t.checked ? "text-emerald-600" : "text-slate-300")} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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

          <ExportMenu
            onExcel={handleExportExcel}
            onCsv={handleExportCsv}
            disabled={!report.data}
            excelHint="Statement with opening & totals"
            csvHint="Plain posting rows"
          />
        </div>
      }
      wrapChildren={false}
    >
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Opening Balance"
          value={opening ? `${formatINR(opening.amount)} ${opening.side}` : "—"}
          note={`As on ${formatDate(appliedFromDate)}`}
          icon={Landmark}
          tone="slate"
        />
        <KpiCard
          label="Total Debit (DR)"
          value={formatINR(totals.totalDr)}
          note={`${filteredData.filter((r) => r.debit > 0).length} debit postings`}
          icon={TrendingUp}
          tone="sky"
        />
        <KpiCard
          label="Total Credit (CR)"
          value={formatINR(totals.totalCr)}
          note={`${filteredData.filter((r) => r.credit > 0).length} credit postings`}
          icon={TrendingDown}
          tone="rose"
        />
        <KpiCard
          label="Closing Balance"
          value={closing ? `${formatINR(closing.amount)} ${closing.side}` : "—"}
          note={report.data?.account ? `As on ${formatDate(appliedToDate)} · ${report.data.account.nature}` : `As on ${formatDate(appliedToDate)}`}
          icon={Scale}
          tone="emerald"
          strong
        />
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mt-4 hidden rounded-xl border border-slate-300/70 bg-slate-100 p-4 shadow-2xs md:block">
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

      {selectedEntry?.voucherId && (
        <VoucherEditModal
          voucherId={selectedEntry.voucherId}
          onClose={() => setSelectedEntry(null)}
          onChanged={() => void report.reload()}
        />
      )}

      {/* Main General Ledger Table Card */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900">
                {hasSelection ? selectionLabel : "General Ledger Statement"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {currentFy && <span className="font-semibold text-slate-700">{currentFy.fiscalYearName} · </span>}
                For the period <span className="font-semibold text-slate-700">{periodLabel}</span> · click a row to
                open the voucher
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

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-pressed={showFilters}
              title={showFilters ? "Hide report filters" : "Show report filters"}
              className={cn(
                "hidden h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer md:inline-flex",
                showFilters
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 md:hidden"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        {!hasSelection ? (
          <div className="m-4 py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Select a ledger to view postings</p>
            <p className="text-xs text-slate-500 mt-1">
              Choose an account group, a specific ledger account or a party in the filters.
            </p>
          </div>
        ) : report.loading && !report.data ? (
          <div className="m-4 py-12 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            Loading ledger postings…
          </div>
        ) : report.error ? (
          <div className="m-4 py-12 text-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
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
              <div className="m-4 py-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                {(report.data?.entries.length ?? 0) === 0
                  ? "No postings for this selection in the chosen period."
                  : "No postings match your search / display filters."}
              </div>
            )}

            {/* Desktop Excel-style grid */}
            <div className="hidden md:block">
              <DataGrid
                rows={filteredData}
                rowKey={(row) => row.lineId}
                onRowClick={setSelectedEntry}
                columns={ledgerColumns}
                pinnedRows={openingPinnedRows}
              />
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-3 p-3">
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
