"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Filter,
  Printer,
  Search,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  PieChart,
  Loader2,
  RotateCcw,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accCoveringLetterService } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  fyStartIso,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import {
  ALL_GROUPS,
  LETTER_PARTY_GROUPS,
  TableStatusRow,
  type LetterToast,
} from "@/components/accounts/ReminderLetterView";
import { cn } from "@/lib/utils";

type ReversalParams = { from: string; to: string; partyId: string };

const STATUS_OPTIONS = ["All", "Active", "Reversed"] as const;

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function BillCoveringLetterReversalView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [partyId, setPartyId] = useState("");
  const [trnNoSearch, setTrnNoSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("All");
  const [fromDate, setFromDate] = useState(fyStartIso());
  const [toDate, setToDate] = useState(todayIso());

  const [params, setParams] = useState<ReversalParams>(() => ({ from: fyStartIso(), to: todayIso(), partyId: "" }));
  const [appliedGroup, setAppliedGroup] = useState(ALL_GROUPS);

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accCoveringLetterService.list({
        from: params.from,
        to: params.to,
        partyId: params.partyId || undefined,
      }),
    [params],
  );

  // Reversal Remark / Reason State
  const [reversalReason, setReversalReason] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Single-Step Reversal Modal State
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [isAuthorised, setIsAuthorised] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<LetterToast | null>(null);

  const partyOptions = useMemo(
    () =>
      (lookups?.parties ?? []).filter((p) => selectedGroup === ALL_GROUPS || p.partyGroup === selectedGroup),
    [lookups, selectedGroup],
  );

  const filteredVouchers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const trn = trnNoSearch.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      if (appliedGroup !== ALL_GROUPS && item.partyGroup !== appliedGroup) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (trn && !item.letterNo.toLowerCase().includes(trn)) return false;
      if (!q) return true;
      return (
        item.letterNo.toLowerCase().includes(q) ||
        (item.partyName ?? "").toLowerCase().includes(q) ||
        (item.preparedBy ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, appliedGroup, statusFilter, trnNoSearch, searchQuery]);

  const selectedVoucher = useMemo(
    () => (data ?? []).find((v) => v.id === selectedId) ?? null,
    [data, selectedId],
  );

  const activeVouchers = filteredVouchers.filter((v) => v.status === "Active");

  const handleDisplayReport = () => {
    if (toDate < fromDate) {
      setToast({ message: "'To' date must be on or after the 'From' date.", variant: "error" });
      return;
    }
    setSelectedId(null);
    setAppliedGroup(selectedGroup);
    setParams({ from: fromDate, to: toDate, partyId });
    setMobileFilterOpen(false);
  };

  const openReversalModal = () => {
    if (!selectedVoucher) return;
    if (!reversalReason.trim()) {
      setToast({ message: "Please enter a reason for reversing the Bill Covering Letter.", variant: "error" });
      return;
    }
    setIsAuthorised(false);
    setShowReversalModal(true);
  };

  const handleExecuteReversal = async () => {
    if (!selectedVoucher) return;
    if (!reversalReason.trim()) {
      setToast({ message: "Please enter a reason for reversing the Bill Covering Letter.", variant: "error" });
      return;
    }
    if (!isAuthorised) {
      setToast({ message: "Please check the authorization box to confirm reversal.", variant: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const reversed = await accCoveringLetterService.reverse(selectedVoucher.id, reversalReason.trim());
      setShowReversalModal(false);
      setReversalReason("");
      setToast({
        message: `Bill Covering Letter '${reversed.letterNo}' reversed; ${reversed.billsCount} bill(s) released for re-issue.`,
        variant: "success",
      });
      void reload();
    } catch (e) {
      setToast({ message: accErrorMessage(e), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterForm = (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Group Dropdown */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPartyId("");
            }}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {[ALL_GROUPS, ...LETTER_PARTY_GROUPS].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Party selector */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Party:</span>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">{lookupsError ? "Parties unavailable" : "All parties"}</option>
            {partyOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partyCode} - {p.partyName}
              </option>
            ))}
          </select>
        </div>

        {/* Trn No Input */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Trn No:</span>
          <input
            type="text"
            value={trnNoSearch}
            onChange={(e) => setTrnNoSearch(e.target.value)}
            placeholder="e.g. BCL/2026-27/0001"
            className="h-8 flex-1 font-mono font-bold rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: Date Range, Status & Display Button */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">From:</span>
            <FODatePicker value={fromDate} onChange={setFromDate} className="w-32" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">To:</span>
            <FODatePicker value={toDate} onChange={setToDate} className="w-32" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={loading}
            className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display Vouchers
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Bill Covering Letter Reversal"
      description="Reverse and unlock issued Bill Covering Letter vouchers, unlinking enclosed customer bills for re-assignment."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Bill Covering Letter Reversal" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
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
            Print Report
          </Button>
        </div>
      }
    >
      {/* Top Controls Toolbar Bar */}
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
            <span>{showFilters ? "Hide Options" : "Reversal Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
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

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            <RotateCcw className="h-3.5 w-3.5 text-rose-700" />
            Target: {selectedVoucher ? selectedVoucher.letterNo : "None Selected"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            Period: {formatDate(params.from)} to {formatDate(params.to)}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                WINHMS Bill Covering Letter Reversal Parameters & Options
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Hide Options
            </button>
          </div>
          {filterForm}
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Reversal Filter Options"
      >
        <div className="p-4">
          {filterForm}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={handleDisplayReport}
            >
              Apply Filter Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Security Warning Banner & Reversal Reason Input */}
      <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-xs space-y-3 font-sans text-xs print:hidden">
        <div className="flex items-start gap-2 text-rose-900 font-semibold">
          <ShieldAlert className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-rose-900">WINHMS Reversal Audit Impact Notice</h4>
            <p className="text-[11px] text-rose-800 leading-tight">
              Reversing a Bill Covering Letter marks it as reversed and releases all enclosed customer invoices back into open unassigned status for re-billing or re-issue.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
            Reversal Reason / Audit Remark: <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            placeholder="Type reason for reversing this covering letter..."
            className="h-8 w-full rounded-xl border border-rose-300 bg-white px-3 text-xs font-medium text-slate-900 focus:border-rose-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Active Covering Letters"
          value={`${activeVouchers.length} Vouchers`}
          sublabel="Eligible for reversal"
          accent="#0284c7"
          icon={FileSpreadsheet}
        />
        <StatMiniCard
          label="Total Enclosed Value"
          value={formatINR(activeVouchers.reduce((sum, v) => sum + v.totalAmount, 0))}
          sublabel="Active letters' bill total"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Selected Target Voucher"
          value={selectedVoucher ? selectedVoucher.letterNo : "None"}
          sublabel={selectedVoucher ? selectedVoucher.partyName ?? "—" : "Select below"}
          accent="#e11d48"
          icon={RotateCcw}
        />
        <StatMiniCard
          label="Impacted Bills Count"
          value={selectedVoucher ? `${selectedVoucher.billsCount} Invoices` : "0"}
          sublabel={selectedVoucher?.status === "Reversed" ? "Already released" : "Will be un-linked"}
          accent="#8b5cf6"
          icon={AlertCircle}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Bill Covering Letter Vouchers for Reversal ({filteredVouchers.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
              Select an active covering letter voucher below and click &apos;Reverse Covering Letter&apos; to process reversal
            </p>
          </div>

          <div className="relative flex-1 sm:w-64 print:hidden">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher # or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Trn No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Trn Dt</th>
                <th className="px-3.5 py-2.5 min-w-[240px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Group</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Bills Count</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Total Amount</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Status</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading || error || filteredVouchers.length === 0 ? (
                <TableStatusRow
                  colSpan={8}
                  loading={loading}
                  error={error}
                  onRetry={() => void reload()}
                  emptyText="No bill covering letter vouchers found for the selected criteria."
                />
              ) : (
                filteredVouchers.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      "hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]",
                      selectedId === row.id && "bg-rose-50/60 font-semibold"
                    )}
                  >
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.letterNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.letterDate)}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">Prepared By: {row.preparedBy ?? "—"}</span>
                      {row.status === "Reversed" && (
                        <span className="text-[10px] text-rose-700 font-medium block">
                          Reversed by {row.reversedBy ?? "—"} on {formatDateTime(row.reversedAt)}
                          {row.reversalReason && ` — ${row.reversalReason}`}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium border-r border-slate-100">{row.partyGroup ?? "—"}</td>
                    <td className="px-2.5 py-2.5 text-center font-bold text-slate-800 border-r border-slate-100">
                      {row.billsCount} Bills
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.totalAmount)}
                    </td>
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          row.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="radio"
                        name="rad-vouch-reversal"
                        checked={selectedId === row.id}
                        onChange={() => setSelectedId(row.id)}
                        className="text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 bg-slate-50/80 p-3 rounded-xl print:hidden">
          <div className="text-xs text-slate-600 font-semibold">
            Selected Voucher for Reversal: <strong className="text-slate-900">{selectedVoucher ? selectedVoucher.letterNo : "None"}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!selectedVoucher || selectedVoucher.status === "Reversed"}
              onClick={openReversalModal}
              className="h-8 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reverse Covering Letter
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/accounts/dashboard")}
              className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white"
            >
              Exit
            </Button>
          </div>
        </div>
      </section>

      {/* Single-Step Reversal Verification Modal */}
      {selectedVoucher && (
        <Modal
          isOpen={showReversalModal}
          onClose={() => setShowReversalModal(false)}
          title="Confirm Bill Covering Letter Reversal"
          maxWidth="md"
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="space-y-3 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-slate-800">
              <div className="flex justify-between">
                <span>Voucher No:</span>
                <strong className="font-mono text-slate-900">{selectedVoucher.letterNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Voucher Date:</span>
                <span>{formatDate(selectedVoucher.letterDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Party Name:</span>
                <strong className="text-slate-900">{selectedVoucher.partyName ?? "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Enclosed Bills:</span>
                <span className="font-bold text-rose-800">{selectedVoucher.billsCount} Invoices will be unlinked</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-rose-200 pt-2 text-slate-900">
                <span>Total Amount:</span>
                <span>{formatINR(selectedVoucher.totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">Reversal Reason:</span>
              <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 font-medium text-[11px]">
                {reversalReason}
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer bg-slate-100 p-2.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={isAuthorised}
                onChange={(e) => setIsAuthorised(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 shrink-0 mt-0.5"
              />
              <span className="text-[11px] text-slate-700 font-semibold leading-tight">
                I authorize the reversal of Covering Letter &apos;{selectedVoucher.letterNo}&apos; and confirm unlinking enclosed customer invoices.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                disabled={!isAuthorised || isSubmitting}
                onClick={() => void handleExecuteReversal()}
                className="px-5 h-8 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                )}
                Confirm Reversal
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReversalModal(false)}
                className="px-4 h-8 text-xs font-semibold text-slate-600 bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
