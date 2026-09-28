"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  Plus,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Clock,
  User,
  ChevronRight,
  Sparkles,
  Save,
  X,
  FileText,
  Layers,
  History,
  Sliders,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  accFiscalPeriodService,
  accFiscalYearService,
  accReportService,
  type FiscalYear,
} from "@/services/accounts";
import { cn } from "@/lib/utils";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  fyStartIso,
  invalidateAccLookups,
  useAccLookups,
  useAccQuery,
} from "./accountsApi";

type FyTab = "overview" | "opening" | "controls" | "closing" | "audit";

type CarryForwardForm = Pick<
  FiscalYear,
  | "carryForwardBalanceSheet"
  | "carryForwardCustomers"
  | "carryForwardVendors"
  | "transferPnlToRetainedEarnings"
  | "retainedEarningsAccountId"
> & { id: string };

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addYearsIso(iso: string, years: number): string {
  return `${parseInt(iso.slice(0, 4), 10) + years}${iso.slice(4)}`;
}

function suggestNextRange(list: FiscalYear[]): { startDate: string; endDate: string } {
  const latestEnd = list.reduce<string | null>((m, fy) => (!m || fy.endDate > m ? fy.endDate : m), null);
  const startDate = latestEnd ? addDaysIso(latestEnd.slice(0, 10), 1) : fyStartIso();
  return { startDate, endDate: addDaysIso(addYearsIso(startDate, 1), -1) };
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FiscalYearView() {
  // Master Fiscal Years State
  const { data, loading, error, reload } = useAccQuery(() => accFiscalYearService.list(), []);
  const fiscalYears = useMemo(() => data ?? [], [data]);
  const { lookups } = useAccLookups();
  const companies = lookups?.companies ?? [];
  const [selectedFyId, setSelectedFyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Selected FY Active Tab
  const [activeTab, setActiveTab] = useState<FyTab>("overview");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Toast Notification
  const [toastMessage, setToastMessageRaw] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const setToastMessage = (msg: string | null, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessageRaw(msg);
  };

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Create FY Form State
  const [createForm, setCreateForm] = useState({
    companyId: "",
    startDate: "",
    endDate: "",
    fiscalYearName: "",
  });

  // Reopen Reason State
  const [reopenReason, setReopenReason] = useState("");

  // Active Selected Fiscal Year
  const activeFy = useMemo(
    () => fiscalYears.find((fy) => fy.id === selectedFyId) || fiscalYears.find((fy) => fy.isCurrent) || fiscalYears[0],
    [fiscalYears, selectedFyId]
  );

  // Current Fiscal Year for Company
  const currentFy = useMemo(() => fiscalYears.find((fy) => fy.isCurrent), [fiscalYears]);

  const activeCompany =
    companies.find((c) => c.id === activeFy?.companyId) ?? companies[0];

  // Unsaved carry-forward edits for the active FY
  const [cfDraft, setCfDraft] = useState<CarryForwardForm | null>(null);
  const carryForward: CarryForwardForm | null =
    cfDraft && cfDraft.id === activeFy?.id
      ? cfDraft
      : activeFy
        ? {
            id: activeFy.id,
            carryForwardBalanceSheet: activeFy.carryForwardBalanceSheet,
            carryForwardCustomers: activeFy.carryForwardCustomers,
            carryForwardVendors: activeFy.carryForwardVendors,
            transferPnlToRetainedEarnings: activeFy.transferPnlToRetainedEarnings,
            retainedEarningsAccountId: activeFy.retainedEarningsAccountId,
          }
        : null;

  const retainedEarningsOptions = (lookups?.ledgers ?? []).filter(
    (l) => l.nature === "Liability" || l.id === carryForward?.retainedEarningsAccountId
  );

  // Year-end closing position & checks (computed by the backend for the selected FY)
  const closingFyId = activeTab === "closing" && activeFy ? activeFy.id : null;
  const closingEnd = activeFy?.endDate.slice(0, 10);
  const closingQuery = useAccQuery(async () => {
    if (!closingFyId) return null;
    const [periods, pnl, receivables, payables] = await Promise.all([
      accFiscalPeriodService.list(closingFyId),
      accReportService.profitLoss({ fiscalYearId: closingFyId }),
      accReportService.outstandingBills({ moduleType: "AR", asOnDate: closingEnd }),
      accReportService.outstandingBills({ moduleType: "AP", asOnDate: closingEnd }),
    ]);
    return {
      unposted: periods.reduce((s, p) => s + (p.checks?.unpostedVouchers ?? 0), 0),
      trialBalanced: periods.every((p) => p.checks?.trialBalanced ?? true),
      trialDifference: periods.reduce((s, p) => s + (p.checks?.trialBalanceDifference ?? 0), 0),
      unreconciledBankLines: periods.reduce((s, p) => s + (p.checks?.unreconciledBankLines ?? 0), 0),
      openPeriods: periods.filter((p) => p.status === "Open").length,
      totalRevenue: pnl.summary.totalRevenue,
      totalExpenses: pnl.summary.totalExpenses,
      netProfit: pnl.summary.netProfit,
      receivableOutstanding: receivables.totalOutstanding,
      payableOutstanding: payables.totalOutstanding,
    };
  }, [closingFyId, closingEnd]);
  const closing = closingQuery.data;

  // Filtered Fiscal Years
  const filteredFiscalYears = useMemo(() => {
    return fiscalYears.filter((fy) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          fy.fiscalYearName.toLowerCase().includes(q) ||
          (fy.fyCode || "").toLowerCase().includes(q) ||
          fy.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fiscalYears, searchQuery]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    try {
      await action();
      invalidateAccLookups();
      await reload();
      if (closingFyId) void closingQuery.reload();
      setToastMessage(successMessage);
      return true;
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const fyName = (fyId: string) => fiscalYears.find((fy) => fy.id === fyId)?.fiscalYearName ?? "fiscal year";

  // Handler: Set Current Fiscal Year
  const handleSetCurrent = (fyId: string) => {
    void runAction(
      () => accFiscalYearService.setCurrent(fyId),
      `Set ${fyName(fyId)} as the active Current Fiscal Year.`
    );
  };

  // Handler: Open Fiscal Year
  const handleOpenYear = (fyId: string) => {
    void runAction(() => accFiscalYearService.open(fyId), `Opened ${fyName(fyId)} for accounting transactions.`);
  };

  // Handler: Close Fiscal Year
  const handleConfirmClose = async () => {
    if (!activeFy) return;
    const ok = await runAction(
      () => accFiscalYearService.close(activeFy.id),
      `Closed fiscal year ${activeFy.fiscalYearName}. Transaction entry locked.`
    );
    if (ok) setShowCloseModal(false);
  };

  // Handler: Reopen Fiscal Year
  const handleConfirmReopen = async () => {
    if (!activeFy) return;
    if (!reopenReason.trim()) {
      setToastMessage("Please enter a valid business reason for reopening.", "error");
      return;
    }
    const ok = await runAction(
      () => accFiscalYearService.reopen(activeFy.id, reopenReason.trim()),
      `Reopened ${activeFy.fiscalYearName}. Books are temporarily accessible.`
    );
    if (ok) {
      setShowReopenModal(false);
      setReopenReason("");
    }
  };

  const handleDeleteYear = async () => {
    if (!activeFy) return;
    if (!window.confirm(`Delete upcoming fiscal year ${activeFy.fiscalYearName}? Its periods will be removed too.`)) return;
    const ok = await runAction(
      () => accFiscalYearService.remove(activeFy.id),
      `Deleted fiscal year ${activeFy.fiscalYearName}.`
    );
    if (ok) setSelectedFyId(null);
  };

  const openCreateModal = () => {
    setCreateForm({
      companyId: activeCompany?.id ?? "",
      fiscalYearName: "",
      ...suggestNextRange(fiscalYears),
    });
    setShowCreateModal(true);
  };

  // Handler: Create Fiscal Year
  const handleCreateFiscalYear = async () => {
    if (!createForm.startDate || !createForm.endDate) {
      setToastMessage("Please select both start date and end date.", "error");
      return;
    }
    if (createForm.endDate <= createForm.startDate) {
      setToastMessage("End date must be after the start date.", "error");
      return;
    }

    const name = createForm.fiscalYearName.trim();
    if (name && fiscalYears.some((fy) => fy.fiscalYearName.toLowerCase() === name.toLowerCase())) {
      setToastMessage(`Fiscal Year ${name} already exists.`, "error");
      return;
    }

    setSaving(true);
    try {
      const created = await accFiscalYearService.create({
        companyId: createForm.companyId || null,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        ...(name ? { fiscalYearName: name } : {}),
      });
      invalidateAccLookups();
      await reload();
      setSelectedFyId(created.id);
      setShowCreateModal(false);
      setToastMessage(`Created new upcoming fiscal period ${created.fiscalYearName}.`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Handler: Update Carry Forward Configs
  const handleCarryForwardChange = <K extends keyof CarryForwardForm>(field: K, value: CarryForwardForm[K]) => {
    if (!carryForward) return;
    setCfDraft({ ...carryForward, [field]: value });
  };

  const handleSaveCarryForward = async () => {
    if (!activeFy || !carryForward) return;
    if (carryForward.transferPnlToRetainedEarnings && !carryForward.retainedEarningsAccountId) {
      setToastMessage("Select the target Retained Earnings account.", "error");
      return;
    }
    const { id: _id, ...body } = carryForward;
    void _id;
    const ok = await runAction(
      () => accFiscalYearService.update(activeFy.id, body),
      `Opening balance carry-forward settings saved for ${activeFy.fiscalYearName}.`
    );
    if (ok) setCfDraft(null);
  };

  const auditTimeline = activeFy
    ? [
        ...activeFy.auditLogs,
        {
          id: `created-${activeFy.id}`,
          action: "Created",
          actor: activeFy.createdBy ?? null,
          reason: null,
          at: activeFy.createdAt,
        },
      ]
    : [];

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Fiscal Year"
      description="Create and manage company financial periods, opening balance carry-forward, year-end closing, and lifecycle history."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Fiscal Year" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={openCreateModal}
            disabled={saving || loading}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Fiscal Year
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={async () => {
              setCfDraft(null);
              await reload();
              if (closingFyId) void closingQuery.reload();
              setToastMessage("Refreshed fiscal years list.");
            }}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className={cn("h-3.5 w-3.5 mr-1 text-slate-500", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Top Company Context Header */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Target Company Entity:</span>
              <span className="font-bold text-xs text-slate-900">
                {activeCompany
                  ? `${activeCompany.legalName || activeCompany.tradeName} (${activeCompany.companyCode})`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Active Current FY Badge */}
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-900 border border-emerald-200 font-bold">
              <Calendar className="h-4 w-4 text-emerald-700" />
              <span>Current Operating FY:</span>
              <span className="font-mono bg-emerald-700 text-white px-2 py-0.5 rounded-md text-[11px]">
                {currentFy?.fiscalYearName ?? "Not set"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: 5 Cols List / 7 Cols Selected Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT COLUMN: Fiscal Years List (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[580px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Fiscal Periods
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {fiscalYears.length} Periods
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fiscal years..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Fiscal Years Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[480px]">
            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading fiscal years…
              </div>
            )}

            {error && !data && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Could not load fiscal years
                </div>
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reload()}
                  className="h-7 text-xs font-semibold bg-white"
                >
                  Retry
                </Button>
              </div>
            )}

            {data && filteredFiscalYears.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                {fiscalYears.length === 0
                  ? "No fiscal years created yet. Use Create Fiscal Year to add one."
                  : "No fiscal years match your search."}
              </div>
            )}

            {filteredFiscalYears.map((fy) => {
              const isSelected = fy.id === activeFy?.id;
              return (
                <div
                  key={fy.id}
                  onClick={() => setSelectedFyId(fy.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {fy.fiscalYearName}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            fy.status === "Open"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : fy.status === "Upcoming"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-200 text-slate-700"
                          )}
                        >
                          {fy.status}
                        </span>

                        {/* Current Badge */}
                        {fy.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        {formatDate(fy.startDate)} → {formatDate(fy.endDate)}
                      </p>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-1",
                        isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400"
                      )}
                    />
                  </div>

                  {/* Contextual Quick Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Code: <strong className="font-mono text-slate-700">{fy.fyCode || "—"}</strong>
                      <span className="ml-1.5">
                        • {fy.closedPeriods}/{fy.totalPeriods} periods closed
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {fy.status === "Upcoming" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleOpenYear(fy.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                        >
                          Open Year
                        </button>
                      )}

                      {fy.status === "Open" && !fy.isCurrent && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSetCurrent(fy.id)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                        >
                          Set Current
                        </button>
                      )}

                      {fy.status === "Open" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFyId(fy.id);
                            setShowCloseModal(true);
                          }}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                        >
                          Close Year
                        </button>
                      )}

                      {fy.status === "Closed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFyId(fy.id);
                            setShowReopenModal(true);
                          }}
                          className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                        >
                          Reopen Year
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Fiscal Year Details & Actions (7 Cols) */}
        {!activeFy || !carryForward ? (
          <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-center text-xs text-slate-400">
            {loading ? "Loading…" : "Select or create a fiscal year to view its details."}
          </div>
        ) : (
        <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {activeFy.fiscalYearName}
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    activeFy.status === "Open"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : activeFy.status === "Upcoming"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {activeFy.status}
                </span>

                {activeFy.isCurrent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Current Operating FY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Period Range:{" "}
                <strong className="text-slate-700">
                  {formatDate(activeFy.startDate)} → {formatDate(activeFy.endDate)}
                </strong>
                {activeFy.fyCode && (
                  <span>
                    {" "}• Code: <strong className="font-mono text-slate-700">{activeFy.fyCode}</strong>
                  </span>
                )}
              </p>
            </div>

            {/* Contextual Top Action */}
            <div className="flex items-center gap-2">
              {activeFy.status === "Upcoming" && (
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleOpenYear(activeFy.id)}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  <Unlock className="h-3.5 w-3.5 mr-1" />
                  Open Fiscal Year
                </Button>
              )}

              {activeFy.status === "Upcoming" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving || activeFy.voucherCount > 0}
                  onClick={() => void handleDeleteYear()}
                  className="rounded-xl text-xs font-bold bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Delete
                </Button>
              )}

              {activeFy.status === "Open" && !activeFy.isCurrent && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleSetCurrent(activeFy.id)}
                  className="rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-600" />
                  Set as Current FY
                </Button>
              )}

              {activeFy.status === "Open" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseModal(true)}
                  className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                >
                  <Lock className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  Close Fiscal Year
                </Button>
              )}

              {activeFy.status === "Closed" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowReopenModal(true)}
                  className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reopen Fiscal Year
                </Button>
              )}
            </div>
          </div>

          {/* TAB NAVIGATION HEADER (5 Contextual Tabs) */}
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs pb-0">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "opening", label: "Opening Balance", icon: FileText },
              { id: "controls", label: "Period Controls", icon: Sliders },
              { id: "closing", label: "Year-End Close", icon: Lock },
              { id: "audit", label: "Audit History", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FyTab)}
                  className={cn(
                    "flex items-center gap-1.5 py-2 px-3 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="text-xs space-y-4 pt-1">
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Contextual Status Banner */}
                <div
                  className={cn(
                    "p-3.5 rounded-xl border flex items-start gap-3",
                    activeFy.status === "Open"
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : activeFy.status === "Upcoming"
                      ? "bg-blue-50/70 border-blue-200 text-blue-900"
                      : "bg-slate-100 border-slate-200 text-slate-800"
                  )}
                >
                  {activeFy.status === "Open" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : activeFy.status === "Upcoming" ? (
                    <Info className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 text-xs">
                    <span className="font-bold block">
                      {activeFy.status === "Open"
                        ? "Active Financial Period"
                        : activeFy.status === "Upcoming"
                        ? "Upcoming Financial Period Initialized"
                        : "Closed Financial Period (Locked)"}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {activeFy.status === "Open"
                        ? "This fiscal period is open for normal transaction entries across Front Office, F&B POS, and General Ledger vouchers."
                        : activeFy.status === "Upcoming"
                        ? "This period has been initialized for the upcoming financial cycle. Open this year when ready to begin posting."
                        : "Year-end closing has been executed for this period. Normal posting is blocked to preserve historical accounting records."}
                    </p>
                  </div>
                </div>

                {/* Key Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Period Duration</span>
                    <p className="font-bold text-slate-900 text-xs">
                      {formatDate(activeFy.startDate)} to {formatDate(activeFy.endDate)}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {activeFy.totalPeriods} monthly periods • {activeFy.closedPeriods} closed • {activeFy.voucherCount} vouchers
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Posting Status</span>
                    <p className="font-bold text-slate-900 text-xs">
                      {activeFy.status === "Open" ? "Transactions Allowed" : "Posting Blocked"}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {activeFy.status === "Open" ? "Voucher entries enabled" : "Requires authorized reopen"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Opening Balance Transfer</span>
                    <p className="font-bold text-slate-900 text-xs">
                      {carryForward.carryForwardBalanceSheet ? "Auto Carry-Forward" : "Manual / Disabled"}
                    </p>
                    <span className="text-[10px] text-slate-500">Balance sheet & ledger balances</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. OPENING BALANCE / CARRY FORWARD TAB */}
            {activeTab === "opening" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Opening Balance Carry-Forward Rules
                  </h4>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(carryForward.carryForwardBalanceSheet)}
                        onChange={(e) => handleCarryForwardChange("carryForwardBalanceSheet", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Carry Forward Balance Sheet Accounts (Assets & Liabilities Closing Balances)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        checked={Boolean(carryForward.carryForwardCustomers)}
                        onChange={(e) => handleCarryForwardChange("carryForwardCustomers", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Carry Forward Customer Outstanding (Sub-Ledger Accounts Receivable Invoices)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        checked={Boolean(carryForward.carryForwardVendors)}
                        onChange={(e) => handleCarryForwardChange("carryForwardVendors", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Carry Forward Vendor Outstanding (Sub-Ledger Accounts Payable Bills)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 pt-1 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        checked={Boolean(carryForward.transferPnlToRetainedEarnings)}
                        onChange={(e) => handleCarryForwardChange("transferPnlToRetainedEarnings", e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4 focus:ring-emerald-500"
                      />
                      <span>Transfer Net Profit / Loss Balance to Retained Earnings Account</span>
                    </label>
                  </div>

                  {carryForward.transferPnlToRetainedEarnings && (
                    <div className="pt-2 border-t border-slate-200">
                      <FormField label="Target Retained Earnings Account" required>
                        <SelectInput
                          value={carryForward.retainedEarningsAccountId ?? ""}
                          onChange={(e) => handleCarryForwardChange("retainedEarningsAccountId", e.target.value || null)}
                          className="bg-white font-semibold h-9"
                        >
                          <option value="">— Select ledger —</option>
                          {retainedEarningsOptions.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </SelectInput>
                      </FormField>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleSaveCarryForward()}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Save Carry-Forward Rules
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PERIOD CONTROLS TAB */}
            {activeTab === "controls" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    Period Controls & Lock Status
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Period Start Date</span>
                      <p className="font-bold text-slate-900 text-xs font-mono">{formatDate(activeFy.startDate)}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Period End Date</span>
                      <p className="font-bold text-slate-900 text-xs font-mono">{formatDate(activeFy.endDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Opened</span>
                      <p className="font-semibold text-slate-900">{formatTimestamp(activeFy.openedAt)}</p>
                      <p className="text-slate-500">{activeFy.openedBy || "—"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Closed</span>
                      <p className="font-semibold text-slate-900">{formatTimestamp(activeFy.closedAt)}</p>
                      <p className="text-slate-500">{activeFy.closedBy || "—"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Last Reopened</span>
                      <p className="font-semibold text-slate-900">{formatTimestamp(activeFy.reopenedAt)}</p>
                      <p className="text-slate-500">
                        {activeFy.reopenedBy || "—"}
                        {activeFy.reopenReason ? ` — ${activeFy.reopenReason}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Transaction Posting Permission:</span>
                      <span className="text-[11px] text-slate-500">
                        {activeFy.status === "Open"
                          ? "Normal voucher posting is enabled for this period."
                          : "Posting is restricted / locked."}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase",
                        activeFy.status === "Open" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                      )}
                    >
                      {activeFy.status === "Open" ? "Allowed" : "Blocked"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                    <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Back-dated voucher limits, future-dated posting toggles, and approval workflows are governed globally by <strong>Company Settings</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. YEAR-END CLOSE TAB */}
            {activeTab === "closing" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Year-End Closure & Pre-Close Validation
                  </h4>

                  {/* Pre-close Validation Checklist */}
                  {closingQuery.loading && !closing && (
                    <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      Running pre-close checks…
                    </div>
                  )}

                  {closingQuery.error && !closing && (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">
                      <span>{closingQuery.error}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void closingQuery.reload()}
                        className="h-7 text-xs font-semibold bg-white"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {closing && (
                    <>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 text-xs block">Pre-Closure Audit Checklist:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {[
                            {
                              ok: closing.unposted === 0,
                              label: `${closing.unposted} Draft / Provisional Voucher(s) Pending`,
                            },
                            {
                              ok: closing.trialBalanced,
                              label: closing.trialBalanced
                                ? "Trial Balance Balanced (Debits = Credits)"
                                : `Trial Balance differs by ${formatINR(closing.trialDifference)}`,
                            },
                            {
                              ok: closing.openPeriods === 0,
                              label:
                                closing.openPeriods === 0
                                  ? "All Monthly Periods Closed"
                                  : `${closing.openPeriods} Monthly Period(s) Still Open`,
                            },
                            {
                              ok: !activeFy.isCurrent,
                              label: activeFy.isCurrent
                                ? "This is the Current FY (set another FY as current first)"
                                : "Not the Current Operating FY",
                            },
                            {
                              ok: closing.unreconciledBankLines === 0,
                              label: `${closing.unreconciledBankLines} Unreconciled Bank Entr${closing.unreconciledBankLines === 1 ? "y" : "ies"}`,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className={cn(
                                "flex items-center gap-2 font-semibold",
                                item.ok ? "text-emerald-700" : "text-amber-700"
                              )}
                            >
                              {item.ok ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Closing Summary */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 text-xs block">Financial Closing Position:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Total Revenue</span>
                            <strong className="text-emerald-700 font-mono text-xs">{formatINR(closing.totalRevenue)}</strong>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Total Expenses</span>
                            <strong className="text-slate-800 font-mono text-xs">{formatINR(closing.totalExpenses)}</strong>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Net Profit / (Loss)</span>
                            <strong
                              className={cn(
                                "font-mono text-xs",
                                closing.netProfit < 0 ? "text-rose-700" : "text-emerald-800"
                              )}
                            >
                              {formatINR(closing.netProfit)}
                            </strong>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Receivables Outstanding</span>
                            <strong className="text-slate-800 font-mono text-xs">{formatINR(closing.receivableOutstanding)}</strong>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 block text-[10px]">Payables Outstanding</span>
                            <strong className="text-slate-800 font-mono text-xs">{formatINR(closing.payableOutstanding)}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex justify-end">
                    {activeFy.status === "Open" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowCloseModal(true)}
                        className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        Execute Year-End Close
                      </Button>
                    ) : activeFy.status === "Closed" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowReopenModal(true)}
                        className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reopen Fiscal Year
                      </Button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Period is upcoming. Open period first to manage closure.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. AUDIT HISTORY TAB */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-600" />
                    Lifecycle & Audit Timeline
                  </h4>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {auditTimeline.map((log) => (
                      <div key={log.id} className="relative space-y-1">
                        <div className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {log.actor || "—"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatTimestamp(log.at)}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 italic">
                            &quot;{log.reason}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* CREATE FISCAL YEAR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>Create New Fiscal Year</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <FormField label="Target Company">
                <SelectInput
                  value={createForm.companyId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, companyId: e.target.value }))}
                  className="bg-white font-semibold h-9"
                >
                  <option value="">— Not linked —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legalName || c.tradeName} ({c.companyCode})
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Date" required>
                  <FODatePicker
                    value={createForm.startDate}
                    onChange={(val) => {
                      setCreateForm((prev) => ({
                        ...prev,
                        startDate: val,
                      }));
                    }}
                  />
                </FormField>

                <FormField label="End Date" required>
                  <FODatePicker
                    value={createForm.endDate}
                    onChange={(val) => {
                      setCreateForm((prev) => ({
                        ...prev,
                        endDate: val,
                      }));
                    }}
                  />
                </FormField>
              </div>

              <FormField label="Fiscal Year Name">
                <TextInput
                  value={createForm.fiscalYearName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, fiscalYearName: e.target.value }))}
                  placeholder={
                    createForm.startDate && createForm.endDate
                      ? `Auto: FY ${createForm.startDate.slice(0, 4)}-${createForm.endDate.slice(2, 4)}`
                      : "Leave blank to auto-generate"
                  }
                  className="bg-white font-mono font-bold h-9"
                />
              </FormField>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                Monthly periods are generated automatically. New fiscal years start as Upcoming; open them when ready to post.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleCreateFiscalYear()}
                disabled={saving}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Create Period
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE FISCAL YEAR CONFIRMATION MODAL */}
      {showCloseModal && activeFy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="h-5 w-5 text-slate-700" />
                <span>Confirm Fiscal Year Closure</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                You are about to close <strong className="font-mono text-slate-900">{activeFy.fiscalYearName}</strong> ({formatDate(activeFy.startDate)} → {formatDate(activeFy.endDate)}).
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Year-End Closing Effect:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  <li>Normal transaction posting into this fiscal year will be blocked.</li>
                  <li>All periods must be closed, no drafts / provisionals pending, and another FY must be current.</li>
                  <li>Existing transaction history remains fully preserved.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCloseModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConfirmClose()}
                disabled={saving}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
              >
                Confirm & Close Year
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN FISCAL YEAR MODAL */}
      {showReopenModal && activeFy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <RotateCcw className="h-5 w-5 text-blue-700" />
                <span>Reopen Fiscal Year</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600">
                Reopening <strong className="font-mono text-slate-900">{activeFy.fiscalYearName}</strong> will temporarily restore status to <strong>Open</strong> for necessary audit corrections. Original accounting history is preserved.
              </p>

              <FormField label="Business Reason for Reopening" required>
                <TextInput
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Auditor Q4 depreciation adjustments"
                  className="bg-white font-medium h-9"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReopenModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConfirmReopen()}
                disabled={saving}
                className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
              >
                Authorize & Reopen
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
