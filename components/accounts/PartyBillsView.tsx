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
  FileText,
  AlertCircle,
  PieChart,
  Loader2,
  Info,
  FileCheck,
  CreditCard,
  Plus,
  Pencil,
  Ban,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { ModulePageShell } from "@/components/pms";
import {
  accPartyBillService,
  accPartyService,
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
const MSME_TYPES = ["<All>", "Micro", "Small", "Medium", "Non-MSME"];
const REF_TYPES = ["Invoice", "Bill", "Advance", "Credit Note", "Debit Note"];

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500";

type BillsParams = {
  moduleType?: ModuleType;
  partyGroup?: string;
  partyId?: string;
  asOnDate: string;
  pendingOnly: boolean;
};

type BillForm = {
  partyId: string;
  moduleType: ModuleType;
  refType: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  amount: string;
  details: string;
  divisionId: string;
  remarks: string;
};

const emptyForm = (): BillForm => ({
  partyId: "",
  moduleType: "AR",
  refType: "Invoice",
  billNo: "",
  billDate: todayIso(),
  dueDate: "",
  amount: "",
  details: "",
  divisionId: "",
  remarks: "",
});

type DisplayStatus = "Settled" | "Partial" | "Unpaid" | "Cancelled";

function statusOf(bill: PartyBill): DisplayStatus {
  return bill.status === "Cancelled" ? "Cancelled" : bill.settlementStatus;
}

function statusClass(status: DisplayStatus) {
  return status === "Settled"
    ? "bg-emerald-100 text-emerald-800"
    : status === "Partial"
    ? "bg-amber-100 text-amber-800"
    : status === "Cancelled"
    ? "bg-slate-200 text-slate-600"
    : "bg-rose-100 text-rose-800";
}

function isLocked(bill: PartyBill | null) {
  return Boolean(bill && (bill.settlements.length > 0 || bill.settledAmount > 0));
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

export function PartyBillsView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());

  // Bill Filter Mode
  const [pendingBillsOnly, setPendingBillsOnly] = useState(true);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Toast State
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  // Row Details Drawer State
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Bill Entry Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<PartyBill | null>(null);
  const [form, setForm] = useState<BillForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cancel Bill State
  const [cancelTarget, setCancelTarget] = useState<PartyBill | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [applied, setApplied] = useState<BillsParams>(() => ({
    asOnDate: todayIso(),
    pendingOnly: true,
  }));

  const { lookups, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const partiesQuery = useAccQuery(() => accPartyService.list(), []);
  const partyById = useMemo(
    () => new Map((partiesQuery.data ?? []).map((p) => [p.id, p])),
    [partiesQuery.data]
  );

  const billsQuery = useAccQuery(
    () =>
      accPartyBillService.list({
        moduleType: applied.moduleType,
        partyGroup: applied.partyGroup,
        partyId: applied.partyId,
        asOnDate: applied.asOnDate,
        pendingOnly: applied.pendingOnly || undefined,
      }),
    [applied]
  );

  const bills = useMemo(() => billsQuery.data ?? [], [billsQuery.data]);
  const loadError = billsQuery.error ?? partiesQuery.error ?? lookupsError;
  const selectedBillDetail = useMemo(
    () => bills.find((b) => b.id === selectedBillId) ?? null,
    [bills, selectedBillId]
  );

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

  const msmeOf = (partyId: string) => partyById.get(partyId)?.msmeType || "Non-MSME";

  // Filtered Bills Logic
  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills.filter((item) => {
      if (selectedMSME !== "<All>" && (partyById.get(item.partyId)?.msmeType || "Non-MSME") !== selectedMSME) {
        return false;
      }

      if (q) {
        return (
          item.billNo.toLowerCase().includes(q) ||
          (item.partyName ?? "").toLowerCase().includes(q) ||
          (item.partyCode ?? "").toLowerCase().includes(q) ||
          item.refType.toLowerCase().includes(q) ||
          (item.partyGroup ?? "").toLowerCase().includes(q) ||
          (item.details ?? "").toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bills, selectedMSME, partyById, searchQuery]);

  // Total Summary Calculations
  const activeBills = useMemo(() => filteredBills.filter((b) => b.status !== "Cancelled"), [filteredBills]);
  const totalBillAmt = useMemo(() => activeBills.reduce((sum, b) => sum + b.amount, 0), [activeBills]);
  const totalSettledAmt = useMemo(() => activeBills.reduce((sum, b) => sum + b.settledAmount, 0), [activeBills]);
  const totalBalanceAmt = useMemo(() => activeBills.reduce((sum, b) => sum + b.balance, 0), [activeBills]);
  const overdueCount = useMemo(
    () => activeBills.filter((b) => b.overdueDays > 0 && b.balance > 0).length,
    [activeBills]
  );

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Handle Display Button
  const handleDisplayReport = () => {
    if (!includeAR && !includeAP) {
      showToast("Select AR and/or AP to display party bills.", "error");
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
      asOnDate,
      pendingOnly: pendingBillsOnly,
    });
    return true;
  };

  const handleRetry = () => {
    if (lookupsError) void reloadLookups(true);
    if (partiesQuery.error) void partiesQuery.reload();
    void billsQuery.reload();
  };

  const handleExportCsv = () => {
    if (filteredBills.length === 0) {
      showToast("Nothing to export for the current filters.", "error");
      return;
    }
    const header = ["Bill No", "Bill Date", "Module", "Ref Type", "Details", "Party Code", "Party Name", "Party Group", "MSME Type", "Due Date", "Bill Amount", "Settled", "Balance", "Overdue Days", "Status", "Covering Letter"];
    const rows = filteredBills.map((b) => [
      b.billNo,
      b.billDate,
      b.moduleType,
      b.refType,
      b.details ?? "",
      b.partyCode ?? "",
      b.partyName ?? "",
      b.partyGroup ?? "",
      msmeOf(b.partyId),
      b.dueDate,
      b.amount.toFixed(2),
      b.settledAmount.toFixed(2),
      b.balance.toFixed(2),
      b.overdueDays,
      statusOf(b),
      b.coveringLetterNo ?? "",
    ]);
    rows.push(["Total", "", "", "", "", "", "", "", "", "", totalBillAmt.toFixed(2), totalSettledAmt.toFixed(2), totalBalanceAmt.toFixed(2), "", "", ""]);
    downloadCsv(`party-bills-${applied.asOnDate}.csv`, [header, ...rows]);
  };

  // Bill Entry Form Handlers
  const openCreateForm = () => {
    setEditingBill(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (bill: PartyBill) => {
    setEditingBill(bill);
    setForm({
      partyId: bill.partyId,
      moduleType: bill.moduleType,
      refType: bill.refType,
      billNo: bill.billNo,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      amount: String(bill.amount),
      details: bill.details ?? "",
      divisionId: bill.divisionId ?? "",
      remarks: bill.remarks ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const setField = <K extends keyof BillForm>(key: K, value: BillForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleModuleChange = (moduleType: ModuleType) =>
    setForm((prev) => ({
      ...prev,
      moduleType,
      refType:
        prev.refType === "Invoice" || prev.refType === "Bill"
          ? moduleType === "AR"
            ? "Invoice"
            : "Bill"
          : prev.refType,
    }));

  const handleSaveBill = async () => {
    const amount = Number(form.amount);
    if (!form.partyId) return setFormError("Select a party.");
    if (!form.billNo.trim()) return setFormError("Bill number is required.");
    if (!form.billDate) return setFormError("Bill date is required.");
    if (!Number.isFinite(amount) || amount <= 0) return setFormError("Bill amount must be greater than zero.");
    if (form.dueDate && form.dueDate < form.billDate) return setFormError("Due date cannot be before the bill date.");

    const base: Partial<PartyBill> = {
      refType: form.refType,
      billNo: form.billNo.trim(),
      billDate: form.billDate,
      details: form.details.trim(),
      divisionId: form.divisionId || null,
      remarks: form.remarks.trim(),
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editingBill) {
        const body: Partial<PartyBill> = { ...base };
        if (form.dueDate) body.dueDate = form.dueDate;
        if (!isLocked(editingBill)) {
          body.partyId = form.partyId;
          body.moduleType = form.moduleType;
          body.amount = amount;
        }
        const saved = await accPartyBillService.update(editingBill.id, body);
        showToast(`Bill ${saved.billNo} updated.`);
      } else {
        const body: Partial<PartyBill> = {
          ...base,
          partyId: form.partyId,
          moduleType: form.moduleType,
          amount,
        };
        if (form.dueDate) body.dueDate = form.dueDate;
        const saved = await accPartyBillService.create(body);
        showToast(`Bill ${saved.billNo} created for ${saved.partyName ?? "party"}.`);
      }
      setFormOpen(false);
      void billsQuery.reload();
    } catch (e) {
      setFormError(accErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const openCancel = (bill: PartyBill) => {
    setCancelTarget(bill);
    setCancelReason("");
    setCancelError(null);
  };

  const handleCancelBill = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      setCancelError("A reason is required to cancel the bill.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await accPartyBillService.cancel(cancelTarget.id, cancelReason.trim());
      showToast(`Bill ${cancelTarget.billNo} cancelled.`);
      setCancelTarget(null);
      void billsQuery.reload();
    } catch (e) {
      setCancelError(accErrorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  const formLocked = isLocked(editingBill);
  const formParty = lookups?.parties.find((p) => p.id === form.partyId);

  // Shared WINHMS Parameter Form Layout
  const renderFilterForm = () => (
    <div className="space-y-3 text-xs">
      {/* Row 1: AR / AP, Group Dropdown, All Parties Checkbox, As On Date, Display Button */}
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

        {/* All Parties Checkbox / Party Selector */}
        <div className="lg:col-span-3 flex items-center gap-2 font-semibold text-slate-700">
          <label htmlFor="chk-all-parties-bills" className="flex items-center gap-1.5 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              id="chk-all-parties-bills"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            All Parties
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
          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={billsQuery.loading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {billsQuery.loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>

      {/* Row 2: Pending Check, MSME Filter */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="lg:col-span-4 flex items-center gap-4 font-semibold text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingBillsOnly}
              onChange={(e) => setPendingBillsOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Pending Bills Only</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">MSME Type:</span>
          <select
            value={selectedMSME}
            onChange={(e) => setSelectedMSME(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {MSME_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Party Bills"
      description="Detailed ledger list of all individual party bills, original invoice amounts, settlements, and outstanding balances."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Party Bills" },
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

          <Button
            type="button"
            size="sm"
            onClick={openCreateForm}
            className="rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Bill
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
            <span>{showFilters ? "Hide Options" : "Party Bills Parameters & Options"}</span>
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
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <FileText className="h-3.5 w-3.5 text-emerald-700" />
            Group: {applied.partyGroup ?? "All Groups"}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {formatDate(applied.asOnDate)}
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
                WINHMS Party Bills Parameters & Options
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
        title="Party Bills Options"
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

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Total Original Bill Value"
          value={formatINR(totalBillAmt)}
          sublabel={`${activeBills.length} party bills`}
          accent="#0284c7"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Settled Amount"
          value={formatINR(totalSettledAmt)}
          sublabel="Received / paid settlements"
          accent="#16a34a"
          icon={FileCheck}
        />
        <StatMiniCard
          label="Net Outstanding Balance"
          value={formatINR(totalBalanceAmt)}
          sublabel="Remaining due balance"
          accent="#f59e0b"
          icon={CreditCard}
        />
        <StatMiniCard
          label="Overdue Bills Count"
          value={`${overdueCount} Overdue`}
          sublabel="Exceeding due date"
          accent="#e11d48"
          icon={AlertCircle}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Bills Table ({filteredBills.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Double click row to view bill details & settlement breakdown
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bill # or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Party Bills Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Bill No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Bill Dt</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Ref Type</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Details</th>
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Due Dt</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">Bill Amt</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200">Settled Amt</th>
                <th className="px-3 py-2.5 text-right w-28 border-r border-slate-200 bg-slate-200/50 font-bold">Balance Amt</th>
                <th className="px-2.5 py-2.5 w-20 border-r border-slate-200 text-center">Due Days</th>
                <th className="px-2.5 py-2.5 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {billsQuery.loading && !billsQuery.data ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                    <Loader2 className="inline h-4 w-4 mr-1.5 animate-spin text-emerald-600" />
                    Loading party bills…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center">
                    <p className="text-rose-700 font-semibold mb-2">{loadError}</p>
                    <Button type="button" size="sm" variant="outline" onClick={handleRetry} className="text-xs">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No party bills found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((row) => {
                  const status = statusOf(row);
                  return (
                    <tr
                      key={row.id}
                      onDoubleClick={() => setSelectedBillId(row.id)}
                      className={cn(
                        "hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]",
                        status === "Cancelled" && "text-slate-400 line-through decoration-slate-300"
                      )}
                      title="Double click to view party bill details"
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.billNo}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.billDate)}</td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-100">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                            row.moduleType === "AR"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {row.refType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800 border-r border-slate-100 truncate max-w-[12rem]">
                        {row.details || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 border-r border-slate-100">
                        <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {row.partyGroup || "—"} • {msmeOf(row.partyId)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.dueDate)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                        {formatINR(row.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-emerald-700 border-r border-slate-100">
                        {row.settledAmount > 0 ? formatINR(row.settledAmount) : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                        {formatINR(row.balance)}
                      </td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-bold text-slate-700">
                        {row.overdueDays} d
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase no-underline",
                            statusClass(status)
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loadError && filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={6} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Party Bills:
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-slate-900">
                    {formatINR(totalBillAmt)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-300 font-bold text-emerald-800">
                    {formatINR(totalSettledAmt)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalBalanceAmt)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Row Detail Drawer (Double Click Party Bill Details) */}
      <Drawer
        open={Boolean(selectedBillDetail)}
        onClose={() => setSelectedBillId(null)}
        title="Party Bill Ledger Details"
        footer={
          selectedBillDetail && selectedBillDetail.status !== "Cancelled" ? (
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCancel(selectedBillDetail)}
                disabled={isLocked(selectedBillDetail)}
                title={isLocked(selectedBillDetail) ? "Remove settlements before cancelling this bill" : undefined}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancel Bill
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => openEditForm(selectedBillDetail)}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit Bill
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedBillDetail && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedBillDetail.partyName ?? "—"}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    statusClass(statusOf(selectedBillDetail))
                  )}
                >
                  {statusOf(selectedBillDetail)}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                {selectedBillDetail.moduleType === "AR" ? "Receivable (AR)" : "Payable (AP)"} • Group: <strong>{selectedBillDetail.partyGroup || "—"}</strong> • MSME: <strong>{msmeOf(selectedBillDetail.partyId)}</strong>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Bill No / Type:</span>
                <strong className="text-slate-900">
                  {selectedBillDetail.billNo} • {selectedBillDetail.refType}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Bill Date:</span>
                <span>{formatDate(selectedBillDetail.billDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{formatDate(selectedBillDetail.dueDate)}</span>
              </div>
              {selectedBillDetail.coveringLetterNo && (
                <div className="flex justify-between">
                  <span>Covering Letter:</span>
                  <span className="font-mono">{selectedBillDetail.coveringLetterNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Original Bill Amount:</span>
                <strong>{formatINR(selectedBillDetail.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Settled Amount:</span>
                <span className="text-emerald-700 font-semibold">{formatINR(selectedBillDetail.settledAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Remaining Outstanding:</span>
                <span className="text-emerald-800 font-bold">
                  {formatINR(selectedBillDetail.balance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                Settlement Breakdown ({selectedBillDetail.settlements.length})
              </p>
              {selectedBillDetail.settlements.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No settlements recorded against this bill yet.</p>
              ) : (
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {selectedBillDetail.settlements.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-2.5 py-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {s.trnType} • {formatDate(s.settlementDate)}
                        </span>
                        <span className="text-slate-500">{s.referenceNo || (s.voucherId ? "Voucher" : "Manual")}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">{formatINR(s.amount)}</span>
                        {s.deductions > 0 && <span className="text-slate-500">Ded. {formatINR(s.deductions)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(selectedBillDetail.details || selectedBillDetail.remarks) && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900 text-[11px] space-y-1">
                {selectedBillDetail.details && (
                  <p>
                    <strong>Details:</strong> {selectedBillDetail.details}
                  </p>
                )}
                {selectedBillDetail.remarks && (
                  <p>
                    <strong>Remarks:</strong> {selectedBillDetail.remarks}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Bill Entry Drawer (Create / Edit) */}
      <Drawer
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editingBill ? `Edit Bill ${editingBill.billNo}` : "New Party Bill"}
        description={
          formLocked ? "This bill has settlements — party, module and amount are locked." : undefined
        }
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveBill}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              {editingBill ? "Save Changes" : "Create Bill"}
            </Button>
          </div>
        }
      >
        <div className="p-4 space-y-3">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <FormField label="Party" required>
            <select
              value={form.partyId}
              onChange={(e) => setField("partyId", e.target.value)}
              disabled={formLocked}
              className={inputClass}
            >
              <option value="">Select party…</option>
              {(lookups?.parties ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partyName} ({p.partyCode}){p.status !== "Active" ? ` — ${p.status}` : ""}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Module" required>
              <select
                value={form.moduleType}
                onChange={(e) => handleModuleChange(e.target.value as ModuleType)}
                disabled={formLocked}
                className={inputClass}
              >
                <option value="AR">AR — Receivable</option>
                <option value="AP">AP — Payable</option>
              </select>
            </FormField>
            <FormField label="Ref Type" required>
              <select
                value={form.refType}
                onChange={(e) => setField("refType", e.target.value)}
                className={inputClass}
              >
                {REF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Bill No" required helperText="Must be unique for the party">
              <input
                type="text"
                value={form.billNo}
                onChange={(e) => setField("billNo", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Amount" required>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                disabled={formLocked}
                className={cn(inputClass, "text-right")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">
                Bill Date<span className="text-red-500"> *</span>
              </span>
              <FODatePicker value={form.billDate} onChange={(v) => setField("billDate", v)} className="w-full" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">Due Date</span>
              <FODatePicker value={form.dueDate} onChange={(v) => setField("dueDate", v)} className="w-full" />
              {!editingBill && (
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  Blank = bill date + {formParty ? formParty.creditDays : "party"} credit days
                </p>
              )}
            </div>
          </div>
          {!editingBill && form.dueDate && (
            <button
              type="button"
              onClick={() => setField("dueDate", "")}
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              Clear due date (use party credit days)
            </button>
          )}

          <FormField label="Division">
            <select
              value={form.divisionId}
              onChange={(e) => setField("divisionId", e.target.value)}
              className={inputClass}
            >
              <option value="">— None —</option>
              {(lookups?.divisions ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.divisionName} ({d.divisionCode})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Details / Particulars">
            <input
              type="text"
              value={form.details}
              onChange={(e) => setField("details", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Remarks">
            <textarea
              value={form.remarks}
              onChange={(e) => setField("remarks", e.target.value)}
              rows={2}
              className={cn(inputClass, "h-auto py-2")}
            />
          </FormField>
        </div>
      </Drawer>

      {/* Cancel Bill Confirmation */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        title={`Cancel Bill ${cancelTarget?.billNo ?? ""}`}
        description="Cancelled bills are removed from outstanding and aging reports. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Keep Bill
            </Button>
            <Button
              type="button"
              onClick={handleCancelBill}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelling ? "Cancelling…" : "Cancel Bill"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {cancelError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {cancelError}
            </div>
          )}
          <FormField label="Reason" required>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className={cn(inputClass, "h-auto py-2")}
              placeholder="Why is this bill being cancelled?"
            />
          </FormField>
        </div>
      </Modal>
    </ModulePageShell>
  );
}
