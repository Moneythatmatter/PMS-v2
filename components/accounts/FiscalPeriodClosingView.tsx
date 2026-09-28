"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Printer,
  Download,
  AlertTriangle,
  ChevronDown,
  Search,
  Filter,
  Check,
  ShieldCheck,
  Clock,
  Layers,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatMiniCard, Drawer } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accFiscalPeriodService, type FiscalPeriod } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type StatusFilter = "All" | "Open" | "Closed";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function hardBlockers(p: FiscalPeriod): string[] {
  const out: string[] = [];
  if (p.checks.unpostedVouchers > 0) out.push(`${p.checks.unpostedVouchers} draft/provisional voucher(s) remain`);
  if (!p.checks.trialBalanced) out.push(`Trial balance differs by ${formatINR(p.checks.trialBalanceDifference)}`);
  return out;
}

function softBlockers(p: FiscalPeriod): string[] {
  const out: string[] = [];
  if (p.checks.unreconciledBankLines > 0) out.push(`${p.checks.unreconciledBankLines} bank entries are not reconciled`);
  if (p.checks.pendingClosingStock > 0) out.push(`${p.checks.pendingClosingStock} closing stock item(s) are not posted to GL`);
  return out;
}

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function FiscalPeriodClosingView() {
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { lookups } = useAccLookups();
  const [selectedFyId, setSelectedFyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const { data, loading, error, reload } = useAccQuery(
    () => accFiscalPeriodService.list(selectedFyId || undefined),
    [selectedFyId],
  );
  const periods = useMemo(() => data ?? [], [data]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<FiscalPeriod | null>(null);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const fiscalYears = lookups?.fiscalYears ?? [];
  const fyName = periods[0]?.fiscalYearName ?? fiscalYears.find((f) => f.id === selectedFyId)?.fiscalYearName ?? "";
  const fyStatus = periods[0]?.fiscalYearStatus;

  const filteredPeriods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return periods.filter((p) => {
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (q) {
        return (
          p.periodCode.toLowerCase().includes(q) ||
          p.periodName.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.closedBy ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [periods, searchQuery, statusFilter]);

  const closedCount = useMemo(() => periods.filter((p) => p.status === "Closed").length, [periods]);
  const openCount = periods.length - closedCount;
  const today = todayIso();
  const readyCount = useMemo(
    () =>
      periods.filter(
        (p) => p.status === "Open" && p.endDate < today && hardBlockers(p).length === 0 && softBlockers(p).length === 0,
      ).length,
    [periods, today],
  );

  const nextPeriod = useMemo(() => periods.find((p) => p.status === "Open") ?? null, [periods]);

  const handleInitiateClosing = (period: FiscalPeriod) => {
    if (nextPeriod && period.id !== nextPeriod.id) {
      setToast({ message: `Close ${nextPeriod.periodName} first — periods close in order.`, variant: "error" });
      return;
    }
    const hard = hardBlockers(period);
    if (hard.length) {
      setToast({ message: `Cannot close ${period.periodName}: ${hard.join("; ")}.`, variant: "error" });
      return;
    }
    setTargetPeriod(period);
    setForceConfirmed(false);
    setCloseError(null);
    setShowCloseModal(true);
  };

  const handleExecuteClosing = async () => {
    if (!targetPeriod) return;
    const needsForce = softBlockers(targetPeriod).length > 0;
    setIsClosing(true);
    setCloseError(null);
    try {
      await accFiscalPeriodService.close(targetPeriod.id, needsForce && forceConfirmed);
      setToast({ message: `✓ ${targetPeriod.periodName} closed successfully.`, variant: "success" });
      setShowCloseModal(false);
      setTargetPeriod(null);
      await reload();
    } catch (e) {
      setCloseError(accErrorMessage(e));
    } finally {
      setIsClosing(false);
    }
  };

  const handleExecutePrimaryClosing = () => {
    if (!nextPeriod) {
      setToast({ message: "All fiscal periods for the selected financial year are already closed.", variant: "error" });
      return;
    }
    handleInitiateClosing(nextPeriod);
  };

  const handleExportCsv = () => {
    const header = [
      "Code", "Period", "Start", "End", "Status", "Unposted Vouchers", "Posted Vouchers", "Total Debit", "Total Credit",
      "TB Difference", "Unreconciled Bank Lines", "Pending Closing Stock", "Closed At", "Closed By", "Reopened At",
      "Reopened By", "Reopen Reason",
    ];
    const rows = filteredPeriods.map((p) => [
      p.periodCode, p.periodName, p.startDate, p.endDate, p.status, p.checks.unpostedVouchers, p.checks.postedVouchers,
      p.checks.totalDebit, p.checks.totalCredit, p.checks.trialBalanceDifference, p.checks.unreconciledBankLines,
      p.checks.pendingClosingStock, p.closedAt, p.closedBy, p.reopenedAt, p.reopenedBy, p.reopenReason,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiscal-periods-${(fyName || "current").replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectClass =
    "mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none";

  const renderFilterForm = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Financial Year
        </p>

        <div>
          <label className="text-[11px] font-semibold text-slate-600">Financial Year (FY):</label>
          <select value={selectedFyId} onChange={(e) => setSelectedFyId(e.target.value)} className={selectClass}>
            <option value="">Current financial year</option>
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.fiscalYearName} ({formatDate(fy.startDate)} to {formatDate(fy.endDate)}) · {fy.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lg:col-span-6 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          Period Status
        </p>

        <div>
          <label className="text-[11px] font-semibold text-slate-600">Show Periods:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClass}
          >
            <option value="All">All periods</option>
            <option value="Open">Open only</option>
            <option value="Closed">Closed only</option>
          </select>
        </div>
      </div>
    </div>
  );

  const checkItem = (label: string, ok: boolean, okText: string, failText: string, soft = false) => (
    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
      <span className="text-slate-600 text-[11px]">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-bold text-[11px]",
          ok ? "text-emerald-800" : soft ? "text-amber-700" : "text-rose-700",
        )}
      >
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : soft ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-rose-600" />
        )}
        {ok ? okText : failText}
      </span>
    </div>
  );

  const targetSoft = targetPeriod ? softBlockers(targetPeriod) : [];

  return (
    <ModulePageShell
      eyebrow="Accounts & Period Audit"
      title="Fiscal Period Closing"
      description="Period-end financial closing, sub-ledger audit verification, and financial period freezing for General Ledger integrity."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Fiscal Period Closing" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExecutePrimaryClosing}
            disabled={loading || !nextPeriod || fyStatus !== "Open"}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Execute Period Closing
          </Button>

          <Link href="/accounts/transactions/fiscal-period-closing-reversing">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 shadow-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 text-rose-700" />
              Reversing View
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Status
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredPeriods.length === 0}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Period Options" : "Fiscal Period Parameters & Options"}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Calendar className="h-3.5 w-3.5 text-emerald-700" />
            FY: {fyName || "—"}
            {fyStatus && ` · ${fyStatus}`}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Lock className="h-3.5 w-3.5 text-slate-600" />
            {closedCount} / {periods.length} Closed
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Fiscal Period Closing Parameters & Options
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Hide Options
            </button>
          </div>
          {renderFilterForm()}
        </div>
      )}

      <Drawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Fiscal Period Options">
        <div className="p-4">
          {renderFilterForm()}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button type="button" className="w-full bg-emerald-700 text-white" onClick={() => setMobileFilterOpen(false)}>
              Apply Options
            </Button>
          </div>
        </div>
      </Drawer>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      )}

      {fyStatus && fyStatus !== "Open" && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          {fyName} is {fyStatus}. Periods can only be closed while the financial year is Open.
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs space-y-3 shadow-2xs">
        <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/80 pb-2">
          <span className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
            Pre-Closing Audit Rules Verification Checklist
          </span>
          <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">
            {nextPeriod ? `Next: ${nextPeriod.periodName}` : periods.length ? "All periods closed" : "—"}
          </span>
        </div>

        {nextPeriod ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {checkItem(
              "Unposted Vouchers",
              nextPeriod.checks.unpostedVouchers === 0,
              "Passed (0 Drafts)",
              `${nextPeriod.checks.unpostedVouchers} Draft/Provisional`,
            )}
            {checkItem(
              "Bank Reconciliation",
              nextPeriod.checks.unreconciledBankLines === 0,
              "Passed (Cleared)",
              `${nextPeriod.checks.unreconciledBankLines} Unreconciled`,
              true,
            )}
            {checkItem(
              "Closing Stock Entry",
              nextPeriod.checks.pendingClosingStock === 0,
              "Passed (Posted)",
              `${nextPeriod.checks.pendingClosingStock} Not Posted`,
              true,
            )}
            {checkItem(
              "Trial Balance",
              nextPeriod.checks.trialBalanced,
              "Balanced (Diff ₹0)",
              `Diff ${formatINR(nextPeriod.checks.trialBalanceDifference)}`,
            )}
          </div>
        ) : (
          <p className="text-[11px] text-emerald-800">
            {loading ? "Loading period checks…" : "There is no open period to verify in this financial year."}
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Total Fiscal Periods"
          value={`${periods.length} Periods`}
          sublabel={fyName || "Annual period schedule"}
          accent="#0284c7"
          icon={Calendar}
        />
        <StatMiniCard
          label="Closed & Locked Periods"
          value={`${closedCount} Closed`}
          sublabel="Locked against new vouchers"
          accent="#16a34a"
          icon={Lock}
        />
        <StatMiniCard
          label="Ready to Close"
          value={`${readyCount} Ready`}
          sublabel="Ended periods with all checks passed"
          accent="#f59e0b"
          icon={Clock}
        />
        <StatMiniCard
          label="Open Active Periods"
          value={`${openCount} Open`}
          sublabel="Accepting voucher postings"
          accent="#8b5cf6"
          icon={Layers}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Fiscal Period Status Log ({filteredPeriods.length} periods)
            </h2>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search period code or name..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-20">Code</th>
                <th className="px-3.5 py-2.5 min-w-[160px]">Period Name</th>
                <th className="px-3 py-2.5 w-24">Start Date</th>
                <th className="px-3 py-2.5 w-24">End Date</th>
                <th className="px-3 py-2.5 text-center w-28">Unposted Drafts</th>
                <th className="px-3 py-2.5 text-center w-28">Bank Recon</th>
                <th className="px-3 py-2.5 text-center w-28">Stock Entry</th>
                <th className="px-3 py-2.5 text-center w-28">Trial Balance</th>
                <th className="px-3.5 py-2.5 w-36">Closed Date</th>
                <th className="px-3.5 py-2.5 min-w-[140px]">Closed By User</th>
                <th className="px-3 py-2.5 text-center w-24">Status</th>
                <th className="px-3 py-2.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && !data ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                    Loading fiscal periods…
                  </td>
                </tr>
              ) : filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    {periods.length === 0
                      ? "No fiscal periods found. Create and open a fiscal year first."
                      : "No fiscal periods match the filters."}
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((row) => {
                  const isClosed = row.status === "Closed";
                  const isEligibleForClosing = nextPeriod?.id === row.id && fyStatus === "Open";

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        isClosed && "bg-slate-50/50",
                      )}
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.periodCode}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">
                        {row.periodName}
                        <span className="block text-[10px] font-medium text-slate-500">
                          {row.checks.postedVouchers} posted voucher(s)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{formatDate(row.startDate)}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">{formatDate(row.endDate)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                            row.checks.unpostedVouchers === 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
                          )}
                        >
                          {row.checks.unpostedVouchers} Drafts
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.checks.unreconciledBankLines === 0 ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Cleared
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium text-[10px]">
                            {row.checks.unreconciledBankLines} Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.checks.pendingClosingStock === 0 ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Posted
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium text-[10px]">
                            {row.checks.pendingClosingStock} Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.checks.trialBalanced ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Balanced
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold text-[10px]">
                            Diff {formatINR(row.checks.trialBalanceDifference)}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-medium">
                        {isClosed ? formatDateTime(row.closedAt) : "-"}
                        {!isClosed && row.reopenedAt && (
                          <span className="block text-[10px] text-rose-600" title={row.reopenReason ?? ""}>
                            Reopened {formatDate(row.reopenedAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 text-[11px] font-medium truncate">
                        {isClosed ? row.closedBy || "-" : row.reopenedBy ? `Reopened by ${row.reopenedBy}` : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            isClosed
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300",
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isClosed ? (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        ) : isEligibleForClosing ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleInitiateClosing(row)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            Lock &amp; Close
                          </Button>
                        ) : (
                          <span
                            title={
                              fyStatus !== "Open"
                                ? `Financial year is ${fyStatus}`
                                : "Previous fiscal periods must be closed first."
                            }
                          >
                            <Button
                              type="button"
                              size="sm"
                              disabled
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-medium border border-slate-200 cursor-not-allowed opacity-60"
                            >
                              Lock &amp; Close
                            </Button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-2.5">
          {filteredPeriods.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              {loading ? "Loading fiscal periods…" : "No fiscal periods found."}
            </div>
          ) : (
            filteredPeriods.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    {row.periodCode} - {row.periodName}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                      row.status === "Closed"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300",
                    )}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {formatDate(row.startDate)} to {formatDate(row.endDate)}
                </p>
                {nextPeriod?.id === row.id && fyStatus === "Open" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleInitiateClosing(row)}
                    className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold"
                  >
                    Lock &amp; Close
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {targetPeriod && (
        <Modal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          title="Confirm Fiscal Period Closing"
          description="Financial Period Audit Confirmation"
          maxWidth="md"
        >
          <div className="space-y-4 font-sans">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1.5">
              <p className="text-slate-800 leading-relaxed font-semibold">You are about to close the selected fiscal period.</p>
              <p className="text-[11px] text-emerald-800 font-medium">
                New vouchers dated within this period will be blocked until it is reopened.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Selected Period:</span>
                <span className="font-bold text-slate-800">
                  {targetPeriod.periodName} ({targetPeriod.periodCode})
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Period Duration:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(targetPeriod.startDate)} to {formatDate(targetPeriod.endDate)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Posted Vouchers:</span>
                <span className="font-bold text-slate-800">{targetPeriod.checks.postedVouchers}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Debit / Credit Totals:</span>
                <span className="font-bold text-emerald-800">
                  {formatINR(targetPeriod.checks.totalDebit)} / {formatINR(targetPeriod.checks.totalCredit)}
                </span>
              </div>
            </div>

            {targetPeriod.endDate >= today && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-900">
                This period has not ended yet (ends {formatDate(targetPeriod.endDate)}).
              </div>
            )}

            {targetSoft.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Pending items
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {targetSoft.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceConfirmed}
                    onChange={(e) => setForceConfirmed(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                  Close anyway despite the pending items
                </label>
              </div>
            )}

            {closeError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-800">
                {closeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCloseModal(false)}
                className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isClosing || (targetSoft.length > 0 && !forceConfirmed)}
                onClick={() => void handleExecuteClosing()}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {isClosing ? "Closing..." : targetSoft.length > 0 ? "Close Anyway" : "Confirm"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
