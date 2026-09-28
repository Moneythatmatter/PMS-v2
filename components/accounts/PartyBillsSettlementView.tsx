"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Download,
  Filter,
  Printer,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  Receipt,
  RefreshCw,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { ModulePageShell } from "@/components/pms";
import {
  accPartyBillService,
  accReportService,
  type BillSettlement,
  type ModuleType,
  type PartyBill,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const PARTY_GROUPS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Corporate Debtors",
  "Travel Agents",
  "Credit Card Company",
  "City Ledger",
];
const SETTLEMENT_TRN_TYPES = ["Receipts", "Payments", "Journal", "Credit Note"];
const ADV_TRN_TYPES = ["<All>", "Invoice", "Bill", "Advance", "Debit Note", ...SETTLEMENT_TRN_TYPES];

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

type SettlementParams = {
  moduleType?: ModuleType;
  partyGroup?: string;
  partyId?: string;
  to: string;
  status: "all" | "pending";
};

type SettlementLine = BillSettlement & { voucherNo?: string | null };

type SettlementRecord = {
  key: string;
  kind: "bill" | "settlement";
  bill: PartyBill;
  trnType: string;
  trnNo: string;
  trnDt: string;
  refTy: string;
  refName: string;
  docNo: string;
  docDt: string;
  refDt: string;
  details: string;
  debitAmt: number;
  creditAmt: number;
  outstandingAmt: number;
};

type SettleForm = {
  amount: string;
  settlementDate: string;
  deductions: string;
  referenceNo: string;
  trnType: string;
  remarks: string;
};

function defaultSettleForm(bill: PartyBill): SettleForm {
  return {
    amount: bill.balance > 0 ? bill.balance.toFixed(2) : "",
    settlementDate: todayIso(),
    deductions: "",
    referenceNo: "",
    trnType: bill.moduleType === "AR" ? "Receipts" : "Payments",
    remarks: "",
  };
}

/** Flatten bills into a WINHMS-style ledger: the bill line followed by each settlement against it. */
function toRecords(bills: PartyBill[]): SettlementRecord[] {
  const out: SettlementRecord[] = [];
  for (const bill of bills) {
    const isAR = bill.moduleType === "AR";
    out.push({
      key: `b-${bill.id}`,
      kind: "bill",
      bill,
      trnType: bill.refType,
      trnNo: bill.billNo,
      trnDt: bill.billDate,
      refTy: bill.refType,
      refName: bill.billNo,
      docNo: bill.coveringLetterNo ?? "",
      docDt: bill.billDate,
      refDt: bill.dueDate,
      details: bill.details ?? "",
      debitAmt: isAR ? bill.amount : 0,
      creditAmt: isAR ? 0 : bill.amount,
      outstandingAmt: bill.balance,
    });
    let running = bill.amount;
    for (const s of bill.settlements as SettlementLine[]) {
      const reduction = s.amount + s.deductions;
      running -= reduction;
      out.push({
        key: `s-${s.id}`,
        kind: "settlement",
        bill,
        trnType: s.trnType,
        trnNo: s.voucherNo || s.referenceNo || "Manual",
        trnDt: s.settlementDate,
        refTy: bill.refType,
        refName: bill.billNo,
        docNo: s.referenceNo ?? "",
        docDt: s.settlementDate,
        refDt: bill.dueDate,
        details: [s.remarks, s.deductions > 0 ? `incl. deductions ${s.deductions.toFixed(2)}` : ""].filter(Boolean).join(" • "),
        debitAmt: isAR ? 0 : reduction,
        creditAmt: isAR ? reduction : 0,
        outstandingAmt: Math.max(0, Math.round(running * 100) / 100),
      });
    }
  }
  return out;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PartyBillsSettlementView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Reference Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());

  // WINHMS Option Checkboxes
  const [pendingBillsOnly, setPendingBillsOnly] = useState(true);
  const [showRefDt, setShowRefDt] = useState(true);
  const [includeDrTrn, setIncludeDrTrn] = useState(true);
  const [includeCrTrn, setIncludeCrTrn] = useState(true);
  const [summaryOnly, setSummaryOnly] = useState(false);

  // WINHMS Advance Filter Modal State
  const [showAdvanceFilterModal, setShowAdvanceFilterModal] = useState(false);
  const [advRefNameFilter, setAdvRefNameFilter] = useState("");
  const [advTrnTypeFilter, setAdvTrnTypeFilter] = useState("<All>");

  // Search & Toast State
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  // Row Details Drawer State (keyed by bill so it refreshes after actions)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [settleDraft, setSettleForm] = useState<SettleForm | null>(null);
  const [settling, setSettling] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SettlementLine | null>(null);
  const [removing, setRemoving] = useState(false);

  const [applied, setApplied] = useState<SettlementParams>(() => ({
    to: todayIso(),
    status: "pending",
  }));

  const { lookups, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const report = useAccQuery(
    () =>
      accReportService.partySettlement({
        to: applied.to,
        moduleType: applied.moduleType,
        partyId: applied.partyId,
        partyGroup: applied.partyGroup,
        status: applied.status,
      }),
    [applied]
  );

  const reportBills = useMemo(() => report.data?.bills ?? [], [report.data]);
  const records = useMemo(() => toRecords(reportBills), [reportBills]);
  const loadError = report.error ?? lookupsError;
  const selectedBill = useMemo(
    () => reportBills.find((b) => b.id === selectedBillId) ?? null,
    [reportBills, selectedBillId]
  );
  const settleForm =
    selectedBill && selectedBill.balance > 0 && selectedBill.status !== "Cancelled"
      ? settleDraft ?? defaultSettleForm(selectedBill)
      : null;

  const groupOptions = useMemo(() => {
    const set = new Set(PARTY_GROUPS);
    lookups?.parties.forEach((p) => p.partyGroup && set.add(p.partyGroup));
    return ["All Groups", ...Array.from(set)];
  }, [lookups]);

  const partyOptions = useMemo(
    () =>
      (lookups?.parties ?? []).filter(
        (p) => selectedGroup === "All Groups" || p.partyGroup === selectedGroup
      ),
    [lookups, selectedGroup]
  );

  // Filtered Records Logic matching WINHMS options & Advance Filter
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const refQ = advRefNameFilter.trim().toLowerCase();
    return records.filter((item) => {
      if (summaryOnly && item.kind === "settlement") return false;

      // DR / CR Trn filters
      if (!includeDrTrn && item.debitAmt > 0) return false;
      if (!includeCrTrn && item.creditAmt > 0) return false;

      // WINHMS Advance Filter (Ref Name & Trn Type)
      if (refQ && !item.refName.toLowerCase().includes(refQ) && !item.docNo.toLowerCase().includes(refQ) && !item.trnNo.toLowerCase().includes(refQ)) {
        return false;
      }
      if (advTrnTypeFilter !== "<All>" && item.trnType !== advTrnTypeFilter) {
        return false;
      }

      // General Search Query
      if (q) {
        return (
          item.trnNo.toLowerCase().includes(q) ||
          item.refName.toLowerCase().includes(q) ||
          (item.bill.partyName ?? "").toLowerCase().includes(q) ||
          (item.bill.partyCode ?? "").toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [records, summaryOnly, includeDrTrn, includeCrTrn, advRefNameFilter, advTrnTypeFilter, searchQuery]);

  // Totals
  const totalDebit = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.debitAmt, 0), [filteredRecords]);
  const totalCredit = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.creditAmt, 0), [filteredRecords]);
  const totalOutstanding = useMemo(() => {
    const seen = new Map<string, number>();
    filteredRecords.forEach((r) => seen.set(r.bill.id, r.bill.balance));
    return Array.from(seen.values()).reduce((sum, v) => sum + v, 0);
  }, [filteredRecords]);

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Handle Display Button
  const handleDisplayReport = () => {
    if (!includeAR && !includeAP) {
      showToast("Select AR and/or AP to display bills and settlements.", "error");
      return false;
    }
    if (!allParties && !selectedPartyId) {
      showToast("Select a party or tick All Parties.", "error");
      return false;
    }
    setApplied({
      moduleType: includeAR && includeAP ? undefined : includeAR ? "AR" : "AP",
      partyGroup: selectedGroup === "All Groups" ? undefined : selectedGroup,
      partyId: allParties ? undefined : selectedPartyId,
      to: asOnDate,
      status: pendingBillsOnly ? "pending" : "all",
    });
    return true;
  };

  const handleRetry = () => {
    if (lookupsError) void reloadLookups(true);
    void report.reload();
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      showToast("Nothing to export for the current filters.", "error");
      return;
    }
    const header = ["Trn Type", "Trn No", "Trn Date", "Ref Type", "Ref Name", "Doc No", "Doc Date", "Due Date", "Party Code", "Party Name", "Details", "Debit", "Credit", "Outstanding"];
    const rows = filteredRecords.map((r) => [
      r.trnType,
      r.trnNo,
      r.trnDt,
      r.refTy,
      r.refName,
      r.docNo,
      r.docDt,
      r.refDt,
      r.bill.partyCode ?? "",
      r.bill.partyName ?? "",
      r.details,
      r.debitAmt ? r.debitAmt.toFixed(2) : "",
      r.creditAmt ? r.creditAmt.toFixed(2) : "",
      r.outstandingAmt.toFixed(2),
    ]);
    rows.push(["Total", "", "", "", "", "", "", "", "", "", "", totalDebit.toFixed(2), totalCredit.toFixed(2), totalOutstanding.toFixed(2)]);
    downloadCsv(`party-bills-settlement-${applied.to}.csv`, [header, ...rows]);
  };

  const openBill = (bill: PartyBill) => {
    setSelectedBillId(bill.id);
    setSettleForm(null);
    setDrawerError(null);
  };

  const handleSettle = async () => {
    if (!selectedBill || !settleForm) return;
    const amount = Number(settleForm.amount);
    const deductions = settleForm.deductions ? Number(settleForm.deductions) : 0;
    if (!Number.isFinite(amount) || amount <= 0) return setDrawerError("Settlement amount must be greater than zero.");
    if (!Number.isFinite(deductions) || deductions < 0) return setDrawerError("Deductions cannot be negative.");
    if (amount + deductions > selectedBill.balance + 0.005) {
      return setDrawerError(`Amount plus deductions cannot exceed the pending balance (${selectedBill.balance.toFixed(2)}).`);
    }
    setSettling(true);
    setDrawerError(null);
    try {
      const updated = await accPartyBillService.settle(selectedBill.id, {
        amount,
        settlementDate: settleForm.settlementDate,
        deductions: deductions || undefined,
        referenceNo: settleForm.referenceNo.trim() || undefined,
        trnType: settleForm.trnType,
        remarks: settleForm.remarks.trim() || undefined,
      });
      showToast(`Settled ${formatINR(amount)} against bill ${updated.billNo}.`);
      setSettleForm(null);
      void report.reload();
    } catch (e) {
      setDrawerError(accErrorMessage(e));
    } finally {
      setSettling(false);
    }
  };

  const handleRemoveSettlement = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setDrawerError(null);
    try {
      await accPartyBillService.removeSettlement(removeTarget.id);
      showToast("Settlement removed.");
      setRemoveTarget(null);
      setSettleForm(null);
      await report.reload();
    } catch (e) {
      setRemoveTarget(null);
      setDrawerError(accErrorMessage(e));
    } finally {
      setRemoving(false);
    }
  };

  const tableColSpan = showRefDt ? 12 : 11;

  // Shared WINHMS Parameter Form Layout
  const renderFilterForm = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: AR / AP, Group Dropdown, All Parties / Party Selector, As On Date, Display Button & Filter Funnel */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* AR / AP Checks */}
        <div className="lg:col-span-2 flex items-center gap-3 font-bold text-slate-800">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAR}
              onChange={(e) => setIncludeAR(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>AR</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAP}
              onChange={(e) => setIncludeAP(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span>AP</span>
          </label>
        </div>

        {/* Group Dropdown */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedPartyId("");
            }}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Party Selector / All Parties */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>All Parties</span>
          </label>

          {!allParties && (
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="h-8 flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none truncate"
            >
              <option value="">Select party…</option>
              {partyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partyName} ({p.partyCode})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          {/* Funnel Icon for WINHMS Advance Filter Modal */}
          <button
            type="button"
            onClick={() => setShowAdvanceFilterModal(true)}
            className="h-8 px-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Open WINHMS Advance Filter Modal"
          >
            <Filter className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Adv Filter</span>
          </button>

          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={report.loading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {report.loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>

      {/* Row 2: WINHMS Control Checkboxes */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700">
        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingBillsOnly}
              onChange={(e) => setPendingBillsOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Pending Bills</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showRefDt}
              onChange={(e) => setShowRefDt(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Due Dt</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDrTrn}
              onChange={(e) => setIncludeDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>DR Trn</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCrTrn}
              onChange={(e) => setIncludeCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>CR Trn</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex items-center gap-3 justify-end">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={summaryOnly}
              onChange={(e) => setSummaryOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Summary (bills only)</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Party Bills & Settlement"
      description="Track detailed bill lifecycle, invoice generation, payment receipt settlements, and outstanding balance status."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Party Bills & Settlement" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
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
            Print Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
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
            <span>{showFilters ? "Hide Options" : "Settlement Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          <button
            type="button"
            onClick={() => setShowAdvanceFilterModal(true)}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5 text-emerald-700" />
            <span>Adv Filter</span>
          </button>

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
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Receipt className="h-3.5 w-3.5 text-emerald-700" />
            Group: {applied.partyGroup ?? "All Groups"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {formatDate(applied.to)}
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
                WINHMS Party Bills & Settlement Parameters & Options
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

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Settlement Filter Options"
      >
        <div className="p-4">
          {renderFilterForm()}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => {
                if (handleDisplayReport()) setMobileFilterOpen(false);
              }}
            >
              Apply Filter Options
            </Button>
          </div>
        </div>
      </Drawer>

      {/* WINHMS Advance Filter Popup Modal */}
      {showAdvanceFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-emerald-600" />
                Advance Filter
              </h3>
              <button
                type="button"
                onClick={() => setShowAdvanceFilterModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Reference Name</label>
                <input
                  type="text"
                  value={advRefNameFilter}
                  onChange={(e) => setAdvRefNameFilter(e.target.value)}
                  placeholder="Enter bill no / reference no..."
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Trn Type</label>
                <select
                  value={advTrnTypeFilter}
                  onChange={(e) => setAdvTrnTypeFilter(e.target.value)}
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {ADV_TRN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setAdvRefNameFilter("");
                  setAdvTrnTypeFilter("<All>");
                }}
                className="px-4 h-7 text-xs font-semibold text-slate-600 mr-auto"
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAdvanceFilterModal(false)}
                className="px-4 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs"
              >
                Ok
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Total Net Outstanding"
          value={formatINR(totalOutstanding)}
          sublabel={`${filteredRecords.length} settlement records`}
          accent="#0284c7"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Debit Amount"
          value={formatINR(totalDebit)}
          sublabel="AR bills & AP settlements"
          accent="#16a34a"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="Total Credit Amount"
          value={formatINR(totalCredit)}
          sublabel="AR settlements & AP bills"
          accent="#f59e0b"
          icon={ArrowUpRight}
        />
        <StatMiniCard
          label="Filtered Records"
          value={`${filteredRecords.length} Transactions`}
          sublabel="Matching parameters"
          accent="#8b5cf6"
          icon={Receipt}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Bills & Settlement Table ({filteredRecords.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click row to view settlement history and settle the bill
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, bill, or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Trn Type</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Trn No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Trn Dt</th>
                <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Ref Ty</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Ref Name</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Doc.No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Doc Dt</th>
                {showRefDt && <th className="px-3 py-2.5 w-24 border-r border-slate-200">Due Dt</th>}
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Details</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">DebitAmt</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">CreditAmt</th>
                <th className="px-3 py-2.5 text-right w-28 font-bold text-slate-900 bg-slate-200/50">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {report.loading && !report.data ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1.5 animate-spin text-emerald-600" />
                    Loading bills and settlements…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center">
                    <p className="text-rose-700 font-semibold mb-2">{loadError}</p>
                    <Button type="button" size="sm" variant="outline" onClick={handleRetry} className="text-xs">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-slate-400 font-medium">
                    No party bills or settlement records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr
                    key={row.key}
                    onDoubleClick={() => openBill(row.bill)}
                    className={cn(
                      "hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]",
                      row.kind === "settlement" && "bg-slate-50/40"
                    )}
                    title="Double click to view settlement details"
                  >
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100">
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          row.kind === "bill"
                            ? row.bill.moduleType === "AR"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        )}
                      >
                        {row.trnType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.trnNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.trnDt)}</td>
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-semibold text-slate-700">
                      {row.refTy}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800 border-r border-slate-100">{row.refName}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600 border-r border-slate-100">{row.docNo || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.docDt)}</td>
                    {showRefDt && (
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.refDt)}</td>
                    )}
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-semibold text-slate-900 block">{row.bill.partyName ?? "—"}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs">{row.details}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                      {row.debitAmt > 0 ? row.debitAmt.toFixed(2) : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                      {row.creditAmt > 0 ? row.creditAmt.toFixed(2) : ""}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right bg-slate-50",
                        row.kind === "bill" ? "font-bold text-slate-900" : "font-medium text-slate-500"
                      )}
                    >
                      {row.outstandingAmt.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loadError && filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={showRefDt ? 9 : 8} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Settlement:
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-900">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-900">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60">
                    {totalOutstanding.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Row Detail Drawer (Double Click Settlement Details) */}
      <Drawer
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBillId(null)}
        title="Party Bill Settlement Traceability"
      >
        {selectedBill && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedBill.partyName ?? "—"}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedBill.settlementStatus === "Settled"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedBill.settlementStatus === "Partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  )}
                >
                  {selectedBill.settlementStatus}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Group: <strong>{selectedBill.partyGroup || "—"}</strong> • Type: <strong>{selectedBill.moduleType}</strong>
              </p>
            </div>

            {drawerError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {drawerError}
              </div>
            )}

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Bill No / Type:</span>
                <strong className="text-slate-900">
                  {selectedBill.billNo} • {selectedBill.refType}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Bill Date:</span>
                <span>{formatDate(selectedBill.billDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{formatDate(selectedBill.dueDate)}</span>
              </div>
              {selectedBill.coveringLetterNo && (
                <div className="flex justify-between">
                  <span>Covering Letter:</span>
                  <span className="font-mono">{selectedBill.coveringLetterNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Bill Amount / Settled:</span>
                <span>
                  {formatINR(selectedBill.amount)} / <span className="text-emerald-700 font-semibold">{formatINR(selectedBill.settledAmount)}</span>
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Remaining Outstanding:</span>
                <span className="text-emerald-800 font-bold">{formatINR(selectedBill.balance)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Settlement History ({selectedBill.settlements.length}):
              </p>
              {selectedBill.settlements.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No settlements recorded against this bill yet.</p>
              ) : (
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {(selectedBill.settlements as SettlementLine[]).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-2 text-[11px]">
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block">
                          {s.trnType} • {formatDate(s.settlementDate)}
                        </span>
                        <span className="text-slate-500 block truncate">
                          {s.voucherNo ? `Voucher ${s.voucherNo}` : "Manual"}
                          {s.referenceNo ? ` • Ref ${s.referenceNo}` : ""}
                          {s.remarks ? ` • ${s.remarks}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">{formatINR(s.amount)}</span>
                          {s.deductions > 0 && <span className="text-slate-500">Ded. {formatINR(s.deductions)}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(s)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          title={s.voucherId ? "Linked to a voucher — reverse the voucher to remove" : "Remove settlement"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {settleForm && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Settle Bill
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Amount" required>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={settleForm.amount}
                      onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                      className={cn(inputClass, "text-right")}
                    />
                  </FormField>
                  <FormField label="Deductions">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={settleForm.deductions}
                      onChange={(e) => setSettleForm({ ...settleForm, deductions: e.target.value })}
                      className={cn(inputClass, "text-right")}
                      placeholder="0.00"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Settlement Date<span className="text-red-500"> *</span>
                    </span>
                    <FODatePicker
                      value={settleForm.settlementDate}
                      onChange={(v) => setSettleForm({ ...settleForm, settlementDate: v })}
                      className="w-full"
                    />
                  </div>
                  <FormField label="Trn Type">
                    <select
                      value={settleForm.trnType}
                      onChange={(e) => setSettleForm({ ...settleForm, trnType: e.target.value })}
                      className={inputClass}
                    >
                      {SETTLEMENT_TRN_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField label="Reference No">
                  <input
                    type="text"
                    value={settleForm.referenceNo}
                    onChange={(e) => setSettleForm({ ...settleForm, referenceNo: e.target.value })}
                    className={inputClass}
                    placeholder="Cheque / UTR / receipt no"
                  />
                </FormField>
                <FormField label="Remarks">
                  <input
                    type="text"
                    value={settleForm.remarks}
                    onChange={(e) => setSettleForm({ ...settleForm, remarks: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSettle}
                    disabled={settling}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    {settling && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    Record Settlement
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={Boolean(removeTarget)}
        onClose={() => !removing && setRemoveTarget(null)}
        onConfirm={handleRemoveSettlement}
        title="Remove Settlement"
        message={
          removeTarget
            ? `Remove the ${removeTarget.trnType} settlement of ${formatINR(removeTarget.amount)} dated ${formatDate(removeTarget.settlementDate)}? The bill balance will increase accordingly.`
            : ""
        }
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
      />
    </ModulePageShell>
  );
}
