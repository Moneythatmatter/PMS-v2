"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Download,
  Filter,
  Printer,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  FileText,
  PieChart,
  Loader2,
  Info,
  CheckSquare,
  Square,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accCoveringLetterService, type CoveringLetter } from "@/services/accounts";
import { formatDate, fyStartIso, todayIso, useAccLookups, useAccQuery } from "@/components/accounts/accountsApi";
import {
  ALL_GROUPS,
  CompanyLetterhead,
  LETTER_PARTY_GROUPS,
  PrintConfirmDialog,
  TableStatusRow,
  amountInWords,
  companyDisplayName,
  useLetterheadCompany,
  type LetterToast,
} from "@/components/accounts/ReminderLetterView";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Covering letter document (shared with the create screen)
// ---------------------------------------------------------------------------

export type CoveringLetterDoc = {
  key: string;
  letterNo: string | null;
  letterDate: string;
  partyName: string;
  partyAddress: string;
  partyGstin: string;
  contactPersonName: string;
  totalAmount: number;
  bills: { key: string; billNo: string | null; billDate: string | null; dueDate: string | null; details: string; amount: number }[];
};

export function coveringLetterDoc(letter: CoveringLetter): CoveringLetterDoc {
  return {
    key: letter.id,
    letterNo: letter.letterNo,
    letterDate: letter.letterDate,
    partyName: letter.partyName ?? "",
    partyAddress: letter.partyAddress,
    partyGstin: letter.partyGstin,
    contactPersonName: letter.contactPersonName,
    totalAmount: letter.totalAmount,
    bills: letter.bills.map((b) => ({
      key: b.id,
      billNo: b.billNo,
      billDate: b.billDate,
      dueDate: b.dueDate,
      details: b.details,
      amount: b.amount,
    })),
  };
}

export function CoveringLetterSheet({
  doc,
  companyName,
  letterhead,
}: {
  doc: CoveringLetterDoc;
  companyName: string;
  letterhead: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900 break-after-page print:border-none print:shadow-none">
      {letterhead}

      {/* Document Header Box */}
      <div className="border border-slate-300 p-2 space-y-1 bg-slate-50/50 text-center">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          BILL COVERING LETTER
        </h2>
      </div>

      {/* Date & Recipient Address */}
      <div className="flex items-start justify-between text-xs pt-2">
        <div className="space-y-1">
          <p className="font-bold text-slate-800">To,</p>
          <p className="font-bold text-slate-900 text-sm">{doc.partyName}</p>
          {doc.partyAddress && <p className="text-slate-600 max-w-xs text-[11px]">{doc.partyAddress}</p>}
          {doc.partyGstin && <p className="text-slate-600 text-[11px]">GSTIN: {doc.partyGstin}</p>}
          {doc.contactPersonName && <p className="text-slate-600 text-[11px]">Attn: {doc.contactPersonName}</p>}
        </div>
        <div className="text-right space-y-1">
          <p className="font-semibold text-slate-700">
            Covering Letter No:{" "}
            <span className="font-mono font-bold text-slate-900">{doc.letterNo ?? "DRAFT (assigned on save)"}</span>
          </p>
          <p className="font-semibold text-slate-700">Date: {formatDate(doc.letterDate)}</p>
        </div>
      </div>

      {/* Body Text */}
      <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
        <p>Dear Sir/Madam,</p>
        <p>
          Please find enclosed herewith our bills for the services rendered. We request you to kindly verify the enclosed invoices and process the payment at your earliest convenience.
        </p>
      </div>

      {/* Enclosed Bills Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
              <th className="px-3 py-1.5 border-r border-slate-300 w-28">Bill No</th>
              <th className="px-3 py-1.5 border-r border-slate-300 w-24">Bill Date</th>
              <th className="px-3 py-1.5 border-r border-slate-300 w-24">Due Date</th>
              <th className="px-3.5 py-1.5 border-r border-slate-300">Particulars / Details</th>
              <th className="px-3 py-1.5 text-right w-32 font-bold bg-slate-200/60">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doc.bills.map((b) => (
              <tr key={b.key} className="h-8">
                <td className="px-3 py-1.5 border-r border-slate-200 font-bold font-mono">{b.billNo ?? "—"}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">{formatDate(b.billDate)}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">{formatDate(b.dueDate)}</td>
                <td className="px-3.5 py-1.5 border-r border-slate-200 text-slate-700 text-[11px]">{b.details}</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-900 bg-slate-50">{b.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
              <td colSpan={4} className="px-3 py-2 text-right uppercase font-bold text-slate-800 border-r border-slate-300">
                Total Enclosed Bills Amount:
              </td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-200/60">{doc.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount In Words */}
      <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
        <strong className="text-slate-800">Amount In Words:</strong>{" "}
        <span className="font-bold text-slate-900">{amountInWords(doc.totalAmount)}</span>
      </div>

      {/* Signatures Footer */}
      <div className="pt-8 grid grid-cols-2 gap-4 text-xs text-slate-800 font-semibold">
        <div>
          <p>Thanking You,</p>
          <p className="font-bold">Accounts & Finance Division</p>
          {companyName && <p className="font-bold mt-2">For {companyName}</p>}
          <p className="pt-8 border-t border-slate-400 mt-4">Authorized Signatory</p>
        </div>

        <div className="text-right border-l border-slate-200 pl-4 space-y-8">
          <p className="font-bold text-slate-900">Client Acknowledgement Slip:</p>
          <p className="border-t border-slate-400 pt-1">Received By / Signature & Stamp</p>
        </div>
      </div>
    </div>
  );
}

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------
// Print view
// ---------------------------------------------------------------------------

type PrintParams = { from: string; to: string; partyId: string };

export function BillCoveringLetterPrintView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();
  const letterhead = useLetterheadCompany();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [partyId, setPartyId] = useState("");
  const [trnNoSearch, setTrnNoSearch] = useState("");
  const [fromDate, setFromDate] = useState(fyStartIso());
  const [toDate, setToDate] = useState(todayIso());

  const [params, setParams] = useState<PrintParams>(() => ({ from: fyStartIso(), to: todayIso(), partyId: "" }));
  const [appliedGroup, setAppliedGroup] = useState(ALL_GROUPS);

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accCoveringLetterService.list({
        status: "Active",
        from: params.from,
        to: params.to,
        partyId: params.partyId || undefined,
      }),
    [params],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Preview & Printer Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);

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
      if (trn && !item.letterNo.toLowerCase().includes(trn)) return false;
      if (!q) return true;
      return (
        item.letterNo.toLowerCase().includes(q) ||
        (item.partyName ?? "").toLowerCase().includes(q) ||
        (item.preparedBy ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, appliedGroup, trnNoSearch, searchQuery]);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => setSelectedIds(new Set(filteredVouchers.map((v) => v.id)));
  const handleClearAll = () => setSelectedIds(new Set());

  const selectedVouchersList = useMemo(
    () => filteredVouchers.filter((v) => selectedIds.has(v.id)),
    [filteredVouchers, selectedIds],
  );

  const totalSelectedAmt = useMemo(
    () => selectedVouchersList.reduce((sum, v) => sum + v.totalAmount, 0),
    [selectedVouchersList],
  );

  const handleDisplayReport = () => {
    if (toDate < fromDate) {
      setToast({ message: "'To' date must be on or after the 'From' date.", variant: "error" });
      return;
    }
    setSelectedIds(new Set());
    setPreviewOpen(false);
    setAppliedGroup(selectedGroup);
    setParams({ from: fromDate, to: toDate, partyId });
    setMobileFilterOpen(false);
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setPreviewOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const handleExportCSV = () => {
    if (filteredVouchers.length === 0) {
      setToast({ message: "Nothing to export for the current filters.", variant: "error" });
      return;
    }
    const csvHeader = "TrnNo,TrnDt,PartyName,Group,BillsCount,TotalAmount,PreparedBy\n";
    const csvRows = filteredVouchers
      .map((v) =>
        [v.letterNo, v.letterDate, v.partyName, v.partyGroup, v.billsCount, v.totalAmount.toFixed(2), v.preparedBy]
          .map(csvCell)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bill_Covering_Letter_Print_Report_${params.from}_to_${params.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: `Exported ${filteredVouchers.length} covering letters to CSV.`, variant: "success" });
  };

  const companyName = companyDisplayName(letterhead.company);

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

      {/* Row 2: Date Range (From - To) & Display Button */}
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
      title="Bill Covering Letter Print"
      description="Query, preview, and re-print official Bill Covering Letters for customer invoice submission and dispatch tracking."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Bill Covering Letter Print" },
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
            onClick={() => setShowPrinterDialog(true)}
            disabled={selectedVouchersList.length === 0}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Selected ({selectedVouchersList.length})
          </Button>
        </div>
      }
    >
      {/* Top Controls Toolbar Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Options" : "Print Parameters & Options"}</span>
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
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            Selected: {selectedVouchersList.length} / {filteredVouchers.length} Vouchers
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            Period: {formatDate(params.from)} to {formatDate(params.to)}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50 print:hidden">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                WINHMS Bill Covering Letter Print Parameters & Options
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
        title="Print Filter Options"
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

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <StatMiniCard
          label="Total Covering Letters"
          value={`${filteredVouchers.length} Vouchers`}
          sublabel="Active, issued in date range"
          accent="#0284c7"
          icon={FileSpreadsheet}
        />
        <StatMiniCard
          label="Total Enclosed Amount"
          value={formatINR(filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0))}
          sublabel="Net enclosed value"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Selected for Printing"
          value={`${selectedVouchersList.length} Statements`}
          sublabel="Targeted for print"
          accent="#f59e0b"
          icon={Printer}
        />
        <StatMiniCard
          label="Selected Enclosed Value"
          value={formatINR(totalSelectedAmt)}
          sublabel="Across selected letters"
          accent="#8b5cf6"
          icon={FileText}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Issued Bill Covering Letters Table ({filteredVouchers.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Select covering letter vouchers to preview or print official statement documents
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
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
                <th className="px-3 py-2.5 w-12 border-r border-slate-200 text-center">#</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Trn No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Trn Dt</th>
                <th className="px-3.5 py-2.5 min-w-[240px] border-r border-slate-200">Party Name</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Group</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Bills Count</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Total Amount</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Prepared By</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading || error || filteredVouchers.length === 0 ? (
                <TableStatusRow
                  colSpan={9}
                  loading={loading}
                  error={error}
                  onRetry={() => void reload()}
                  emptyText="No active bill covering letters found matching criteria."
                />
              ) : (
                filteredVouchers.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleToggleSelect(row.id)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.letterNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.letterDate)}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-medium border-r border-slate-100">{row.partyGroup ?? "—"}</td>
                    <td className="px-2.5 py-2.5 text-center font-bold text-slate-800 border-r border-slate-100">
                      {row.billsCount} Bills
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.totalAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 border-r border-slate-100">{row.preparedBy ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleToggleSelect(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && !error && filteredVouchers.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={6} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Balance ({selectedVouchersList.length} vouchers):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalSelectedAmt)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Action Footer Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 bg-slate-50/80 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <Square className="h-3.5 w-3.5 mr-1 text-slate-400" />
              Clear All
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={selectedVouchersList.length === 0}
              onClick={() => setPreviewOpen(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Document
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedVouchersList.length === 0}
              onClick={() => setShowPrinterDialog(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Selected
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 px-3.5 text-xs font-semibold text-slate-700 bg-white"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Export CSV
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

      <PrintConfirmDialog
        open={showPrinterDialog}
        documentsLabel={`${selectedVouchersList.length} Covering Letters`}
        onConfirm={handleConfirmPrinterDialog}
        onCancel={() => setShowPrinterDialog(false)}
      />

      {/* Formatted Bill Covering Letter Printable Document Sheet Modal */}
      {previewOpen && selectedVouchersList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Bill Covering Letter Sheet ({selectedVouchersList.length === 1 ? selectedVouchersList[0].letterNo : `${selectedVouchersList.length} letters`})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Letter
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedVouchersList.map((letter) => (
              <CoveringLetterSheet
                key={letter.id}
                doc={coveringLetterDoc(letter)}
                companyName={companyName}
                letterhead={<CompanyLetterhead {...letterhead} />}
              />
            ))}
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
