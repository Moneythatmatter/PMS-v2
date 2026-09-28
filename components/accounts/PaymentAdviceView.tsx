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
  X,
  FileText,
  PieChart,
  Loader2,
  Info,
  CheckSquare,
  Square,
  Eye,
  Receipt,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type PaymentAdvice } from "@/services/accounts";
import { formatDate, fyStartIso, todayIso, useAccLookups, useAccQuery } from "@/components/accounts/accountsApi";
import {
  ALL_GROUPS,
  CompanyLetterhead,
  LETTER_PARTY_GROUPS,
  PrintConfirmDialog,
  TableStatusRow,
  amountInWords,
  useLetterheadCompany,
  type LetterToast,
} from "@/components/accounts/ReminderLetterView";
import { cn } from "@/lib/utils";

type AdviceParams = { from: string; to: string; partyId: string };

export function PaymentAdviceView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();
  const letterhead = useLetterheadCompany();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState(fyStartIso());
  const [toDate, setToDate] = useState(todayIso());

  const [params, setParams] = useState<AdviceParams>(() => ({ from: fyStartIso(), to: todayIso(), partyId: "" }));
  const [appliedGroup, setAppliedGroup] = useState(ALL_GROUPS);

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accReportService.paymentAdvice({
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

  const partyGroupById = useMemo(
    () => new Map((lookups?.parties ?? []).map((p) => [p.id, p.partyGroup])),
    [lookups],
  );

  const supplierOptions = useMemo(
    () =>
      (lookups?.parties ?? []).filter((p) => selectedGroup === ALL_GROUPS || p.partyGroup === selectedGroup),
    [lookups, selectedGroup],
  );

  const filteredAdvices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (data?.advices ?? []).filter((item) => {
      if (appliedGroup !== ALL_GROUPS && partyGroupById.get(item.partyId) !== appliedGroup) return false;
      if (!q) return true;
      return (
        item.voucherNo.toLowerCase().includes(q) ||
        item.instrumentNo.toLowerCase().includes(q) ||
        (item.partyName ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, appliedGroup, partyGroupById, searchQuery]);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => setSelectedIds(new Set(filteredAdvices.map((a) => a.voucherId)));
  const handleClearAll = () => setSelectedIds(new Set());

  const selectedAdvicesList = useMemo(
    () => filteredAdvices.filter((a) => selectedIds.has(a.voucherId)),
    [filteredAdvices, selectedIds],
  );

  const totalSelectedChqAmt = useMemo(
    () => selectedAdvicesList.reduce((sum, a) => sum + a.amount, 0),
    [selectedAdvicesList],
  );

  const instrumentsCount = selectedAdvicesList.filter((a) => a.instrumentNo).length;

  const handleDisplayReport = () => {
    if (toDate < fromDate) {
      setToast({ message: "'To' date must be on or after the 'From' date.", variant: "error" });
      return;
    }
    setSelectedIds(new Set());
    setPreviewOpen(false);
    setAppliedGroup(selectedGroup);
    setParams({ from: fromDate, to: toDate, partyId: supplierId });
    setMobileFilterOpen(false);
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setPreviewOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const periodFrom = data?.from ?? params.from;
  const periodTo = data?.to ?? params.to;

  const filterForm = (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Group Dropdown */}
        <div className="lg:col-span-6 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSupplierId("");
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

        {/* Supplier selector */}
        <div className="lg:col-span-6 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Supplier:</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">{lookupsError ? "Parties unavailable" : "All suppliers"}</option>
            {supplierOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partyCode} - {p.partyName}
              </option>
            ))}
          </select>
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
            Display
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Payment Advice"
      description="Generate, preview, and print official Payment Advice disbursement documents for vendor bill settlements."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Payment Advice" },
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
            disabled={selectedAdvicesList.length === 0}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Payment Advices ({selectedAdvicesList.length})
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
            <span>{showFilters ? "Hide Options" : "Advice Parameters & Options"}</span>
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
            <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
            Group: {appliedGroup}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            Period: {formatDate(periodFrom)} to {formatDate(periodTo)}
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
                WINHMS Payment Advice Parameters & Options
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
        title="Payment Advice Options"
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
          label="Selected Payment Vouchers"
          value={`${selectedAdvicesList.length} Vouchers`}
          sublabel="Targeted for advice slips"
          accent="#0284c7"
          icon={Receipt}
        />
        <StatMiniCard
          label="Total Disbursement Amount"
          value={formatINR(totalSelectedChqAmt)}
          sublabel="Net payment total"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Cheques / UTR Issued"
          value={`${instrumentsCount} Instruments`}
          sublabel="Selected vouchers with instrument no."
          accent="#f59e0b"
          icon={CreditCard}
        />
        <StatMiniCard
          label="Advices Ready to Print"
          value={`${selectedAdvicesList.length} Slips`}
          sublabel="Formatted advice documents"
          accent="#8b5cf6"
          icon={FileText}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Payment Advice Vouchers Table ({filteredAdvices.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Posted payment vouchers with a party. Select vouchers to preview or print advice slips
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher #, chq #, or supplier..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">VouchNo</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchDt</th>
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Supplier</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Chq.No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Chq Dt</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Chq Amt</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading || error || filteredAdvices.length === 0 ? (
                <TableStatusRow
                  colSpan={7}
                  loading={loading}
                  error={error}
                  onRetry={() => void reload()}
                  emptyText="No posted payment vouchers found matching criteria."
                />
              ) : (
                filteredAdvices.map((row) => (
                  <tr
                    key={row.voucherId}
                    onClick={() => handleToggleSelect(row.voucherId)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.voucherNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.voucherDate)}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                      {row.paymentMethodName && (
                        <span className="text-[10px] text-slate-500 font-medium block">{row.paymentMethodName}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 font-semibold border-r border-slate-100">{row.instrumentNo || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.instrumentDate)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.voucherId)}
                        onChange={() => handleToggleSelect(row.voucherId)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && !error && filteredAdvices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={5} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Total Selected Payment Amount ({selectedAdvicesList.length} vouchers):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalSelectedChqAmt)}
                  </td>
                  <td></td>
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
              disabled={selectedAdvicesList.length === 0}
              onClick={() => setPreviewOpen(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Advice
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedAdvicesList.length === 0}
              onClick={() => setShowPrinterDialog(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print
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
        documentsLabel={`${selectedAdvicesList.length} Payment Advice Slips`}
        onConfirm={handleConfirmPrinterDialog}
        onCancel={() => setShowPrinterDialog(false)}
      />

      {/* Formatted Payment Advice Printable Document Sheet Modal */}
      {previewOpen && selectedAdvicesList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Payment Advice Sheet ({selectedAdvicesList.length === 1 ? selectedAdvicesList[0].voucherNo : `${selectedAdvicesList.length} vouchers`})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Advice
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

            {selectedAdvicesList.map((advice) => (
              <PaymentAdviceSheet
                key={advice.voucherId}
                advice={advice}
                letterhead={<CompanyLetterhead {...letterhead} />}
              />
            ))}
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}

function PaymentAdviceSheet({ advice, letterhead }: { advice: PaymentAdvice; letterhead: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900 break-after-page print:border-none print:shadow-none">
      {letterhead}

      {/* Title Header Box */}
      <div className="border border-slate-300 p-2 space-y-1 bg-slate-50/50 text-center">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          PAYMENT ADVICE
        </h2>
      </div>

      {/* Metadata & Supplier Box */}
      <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-3 rounded">
        <div className="space-y-1">
          <p className="font-bold text-slate-800">Paid To Supplier:</p>
          <p className="font-bold text-slate-900 text-sm">{advice.partyName ?? "—"}</p>
          {advice.partyAddress && <p className="text-slate-600 text-[11px]">{advice.partyAddress}</p>}
          {advice.bankName && (
            <p className="text-slate-700 text-[11px]">
              Beneficiary Bank: <strong>{advice.bankName}</strong>
              {advice.bankAccountNumber && ` • A/c ${advice.bankAccountNumber}`}
              {advice.bankIfsc && ` • IFSC ${advice.bankIfsc}`}
            </p>
          )}
        </div>

        <div className="space-y-1 text-right border-l border-slate-200 pl-3">
          <p><strong>Voucher No:</strong> {advice.voucherNo}</p>
          <p><strong>Voucher Date:</strong> {formatDate(advice.voucherDate)}</p>
          <p><strong>Chq / Ref No:</strong> <span className="font-mono font-bold text-emerald-800">{advice.instrumentNo || advice.referenceNo || "—"}</span></p>
          <p><strong>Chq / Ref Date:</strong> {formatDate(advice.instrumentDate)}</p>
          {(advice.bankCashAccountName || advice.paymentMethodName) && (
            <p className="text-[11px] text-slate-600">
              {[advice.bankCashAccountName && `Paid From: ${advice.bankCashAccountName}`, advice.paymentMethodName]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>
      </div>

      {/* Settled Invoices Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
              <th className="px-3 py-1.5 border-r border-slate-300">Supplier Invoice No</th>
              <th className="px-3 py-1.5 border-r border-slate-300">Invoice Date</th>
              <th className="px-3 py-1.5 text-right border-r border-slate-300">Invoice Bill Amt (₹)</th>
              <th className="px-3 py-1.5 text-right border-r border-slate-300">Deductions / TDS (₹)</th>
              <th className="px-3 py-1.5 text-right font-bold bg-slate-200/60">Net Paid Amt (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {advice.bills.length === 0 ? (
              <tr className="h-8">
                <td colSpan={5} className="px-3 py-1.5 text-center text-slate-500 italic">
                  On-account payment — no bills allocated{advice.narration ? ` (${advice.narration})` : ""}
                </td>
              </tr>
            ) : (
              advice.bills.map((inv) => (
                <tr key={inv.billId} className="h-8">
                  <td className="px-3 py-1.5 border-r border-slate-200 font-bold font-mono">{inv.billNo ?? "—"}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">{formatDate(inv.billDate)}</td>
                  <td className="px-3 py-1.5 text-right border-r border-slate-200 font-semibold">
                    {inv.billAmount != null ? inv.billAmount.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right border-r border-slate-200 text-slate-600">{inv.deductions.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-slate-900 bg-slate-50">{inv.paidAmount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
              <td colSpan={4} className="px-3 py-2 text-right uppercase font-bold text-slate-800 border-r border-slate-300">
                Total Amount Paid:
              </td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-200/60">{advice.amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount In Words */}
      <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
        <strong className="text-slate-800">Amount In Words:</strong>{" "}
        <span className="font-bold text-slate-900">{amountInWords(advice.amount)}</span>
      </div>

      {/* Signatures Footer */}
      <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 font-semibold">
        <div>
          <p className="border-t border-slate-400 pt-1">Prepared By</p>
        </div>
        <div>
          <p className="border-t border-slate-400 pt-1">Checked By (Accounts Head)</p>
        </div>
        <div>
          <p className="border-t border-slate-400 pt-1">Receiver&apos;s Signature & Stamp</p>
        </div>
      </div>
    </div>
  );
}
