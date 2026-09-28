"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Filter,
  Printer,
  Search,
  SlidersHorizontal,
  Users,
  ChevronDown,
  X,
  PieChart,
  ArrowDownLeft,
  Loader2,
  Info,
  CheckSquare,
  Square,
  Eye,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accReportService, type BalanceConfirmationRow, type DrCr } from "@/services/accounts";
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

type ConfirmationParams = { from: string; to: string; partyGroup: string; partyId: string; includeZero: boolean };

// Format WINHMS Amount with D or C indicator
const formatWINHMSAmount = (amt: number, side?: "Dr" | "Cr") => {
  if (amt === 0) return "0.00";
  const formatted = Math.abs(amt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted}${side ? side.charAt(0) : ""}`;
};

const formatDrCr = (v: DrCr) => formatWINHMSAmount(v.amount, v.side);

export function BalanceConfirmationView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();
  const letterhead = useLetterheadCompany();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters (applied on Display)
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [allParties, setAllParties] = useState(true);
  const [partyId, setPartyId] = useState("");
  const [fromDate, setFromDate] = useState(fyStartIso());
  const [asOnDate, setAsOnDate] = useState(todayIso());
  const [includeZero, setIncludeZero] = useState(false);

  const [params, setParams] = useState<ConfirmationParams>(() => ({
    from: fyStartIso(),
    to: todayIso(),
    partyGroup: "",
    partyId: "",
    includeZero: false,
  }));

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accReportService.balanceConfirmation({
        from: params.from,
        to: params.to,
        partyGroup: params.partyGroup || undefined,
        partyId: params.partyId || undefined,
        includeZero: params.includeZero || undefined,
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

  const filteredParties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (item) =>
        !q ||
        item.partyName.toLowerCase().includes(q) ||
        item.partyCode.toLowerCase().includes(q) ||
        item.contactPersonName.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => setSelectedIds(new Set(filteredParties.map((p) => p.partyId)));
  const handleClearAll = () => setSelectedIds(new Set());

  const selectedPartiesList = useMemo(
    () => filteredParties.filter((p) => selectedIds.has(p.partyId)),
    [filteredParties, selectedIds],
  );

  const totalSelectedAmt = useMemo(
    () => selectedPartiesList.reduce((sum, p) => sum + p.closing.net, 0),
    [selectedPartiesList],
  );

  const totalSelectedDebits = useMemo(
    () => selectedPartiesList.reduce((sum, p) => sum + p.debit, 0),
    [selectedPartiesList],
  );

  const handleDisplayReport = () => {
    if (!allParties && !partyId) {
      setToast({ message: "Select a party or tick 'All Parties'.", variant: "error" });
      return;
    }
    if (asOnDate < fromDate) {
      setToast({ message: "'As On' date must be on or after the 'From' date.", variant: "error" });
      return;
    }
    setSelectedIds(new Set());
    setPreviewOpen(false);
    setParams({
      from: fromDate,
      to: asOnDate,
      partyGroup: selectedGroup === ALL_GROUPS ? "" : selectedGroup,
      partyId: allParties ? "" : partyId,
      includeZero,
    });
    setMobileFilterOpen(false);
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setPreviewOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const companyName = companyDisplayName(letterhead.company);
  const periodFrom = data?.from ?? params.from;
  const periodTo = data?.to ?? params.to;
  const netSide = totalSelectedAmt >= 0 ? "Dr" : "Cr";

  const filterForm = (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Group Dropdown */}
        <div className="lg:col-span-3 flex items-center gap-2">
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

        {/* All Parties Checkbox / Party selector */}
        <div className="lg:col-span-3 flex flex-col gap-1.5 font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="chk-all-parties-balance"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <label htmlFor="chk-all-parties-balance" className="cursor-pointer">
              All Parties
            </label>
          </div>
          {!allParties && (
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">{lookupsError ? "Parties unavailable" : "Select party..."}</option>
              {partyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partyCode} - {p.partyName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* From / As On Date & Display Button */}
        <div className="lg:col-span-4 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">From:</span>
          <FODatePicker value={fromDate} onChange={setFromDate} className="w-32" />
          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={loading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>

        {/* Zero balance option */}
        <div className="lg:col-span-2 flex items-center justify-end gap-3 text-[11px] font-semibold text-slate-700">
          <label className="flex items-center gap-1 cursor-pointer border-l border-slate-200 pl-3">
            <input
              type="checkbox"
              checked={includeZero}
              onChange={(e) => setIncludeZero(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Include zero balances</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Balance Confirmation"
      description="Generate formal Balance Confirmation statements and client verification slips for audit and accounting reconciliation."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Balance Confirmation" },
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
            disabled={selectedPartiesList.length === 0}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Confirmation Statements ({selectedPartiesList.length})
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
            <span>{showFilters ? "Hide Options" : "Confirmation Parameters & Options"}</span>
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
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
            Selected: {selectedPartiesList.length} / {filteredParties.length} Parties
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formatDate(periodFrom)} to {formatDate(periodTo)}
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
                WINHMS Balance Confirmation Parameters & Options
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
        title="Confirmation Options"
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
          label="Selected Parties"
          value={`${selectedPartiesList.length} Accounts`}
          sublabel="For audit confirmation"
          accent="#0284c7"
          icon={Users}
        />
        <StatMiniCard
          label="Net Closing Balance"
          value={formatWINHMSAmount(totalSelectedAmt, netSide)}
          sublabel="Net account balance"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Total Verified Debits"
          value={formatINR(totalSelectedDebits)}
          sublabel="Selected parties, in period"
          accent="#f59e0b"
          icon={ArrowDownLeft}
        />
        <StatMiniCard
          label="Statements Ready to Print"
          value={`${selectedPartiesList.length} Certificates`}
          sublabel="Audit ready documents"
          accent="#8b5cf6"
          icon={FileCheck2}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Accounts for Balance Confirmation ({filteredParties.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Balances from posted ledger entries tagged with each party
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party code or name..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-12 border-r border-slate-200 text-center">#</th>
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Party_ID</th>
                <th className="px-3.5 py-2.5 min-w-[260px] border-r border-slate-200">Party</th>
                <th className="px-3 py-2.5 text-right w-32 border-r border-slate-200">Opening</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Closing Balance</th>
                <th className="px-3 py-2.5 text-center w-24">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading || error || filteredParties.length === 0 ? (
                <TableStatusRow
                  colSpan={6}
                  loading={loading}
                  error={error}
                  onRetry={() => void reload()}
                  emptyText="No party balances found for the selected criteria."
                />
              ) : (
                filteredParties.map((row, idx) => (
                  <tr
                    key={row.partyId}
                    onClick={() => handleToggleSelect(row.partyId)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                  >
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.partyCode}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {[row.partyGroup, row.contactPersonName && `Contact: ${row.contactPersonName}`, row.email]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700 border-r border-slate-100">
                      {formatDrCr(row.opening)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatDrCr(row.closing)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.partyId)}
                        onChange={() => handleToggleSelect(row.partyId)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && !error && filteredParties.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Grand Total Balance ({selectedPartiesList.length} parties):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatWINHMSAmount(totalSelectedAmt, netSide)}
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
              disabled={selectedPartiesList.length === 0}
              onClick={() => setPreviewOpen(true)}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Statement
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedPartiesList.length === 0}
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
        documentsLabel={`${selectedPartiesList.length} Confirmation Statements`}
        onConfirm={handleConfirmPrinterDialog}
        onCancel={() => setShowPrinterDialog(false)}
      />

      {/* Formatted Balance Confirmation Statement Document Sheet Modal */}
      {previewOpen && selectedPartiesList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Balance Confirmation Sheet ({selectedPartiesList.length === 1 ? selectedPartiesList[0].partyName : `${selectedPartiesList.length} parties`})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPrinterDialog(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Statement
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

            {selectedPartiesList.map((party) => (
              <BalanceConfirmationSheet
                key={party.partyId}
                party={party}
                from={periodFrom}
                asOnDate={periodTo}
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

function BalanceConfirmationSheet({
  party,
  from,
  asOnDate,
  companyName,
  letterhead,
}: {
  party: BalanceConfirmationRow;
  from: string;
  asOnDate: string;
  companyName: string;
  letterhead: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900 break-after-page print:border-none print:shadow-none">
      {letterhead}

      {/* Date & Recipient Address */}
      <div className="flex items-start justify-between text-xs pt-2">
        <div className="space-y-1">
          <p className="font-bold text-slate-800">To,</p>
          <p className="font-bold text-slate-900 text-sm">{party.partyName}</p>
          {party.address && <p className="text-slate-600 max-w-xs text-[11px]">{party.address}</p>}
          {party.gstin && <p className="text-slate-600 text-[11px]">GSTIN: {party.gstin}</p>}
          {party.contactPersonName && <p className="text-slate-600 text-[11px]">Attn: {party.contactPersonName}</p>}
        </div>
        <div className="text-right space-y-1">
          <p className="font-semibold text-slate-700">Date: {formatDate(asOnDate)}</p>
          <p className="font-mono text-[11px] text-slate-500">Statement Ref: BC/{party.partyCode}/{asOnDate}</p>
        </div>
      </div>

      {/* Subject Line */}
      <div className="bg-slate-100 p-2 text-center rounded border border-slate-200">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          BALANCE CONFIRMATION STATEMENT
        </h2>
      </div>

      {/* Body Text */}
      <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
        <p>Dear Sir/Madam,</p>
        <p>
          We request you to kindly verify and confirm the closing balance standing in your account in our books as on <strong>{formatDate(asOnDate)}</strong>. Below is the summary of your account ledger for the period {formatDate(from)} to {formatDate(asOnDate)}.
        </p>
      </div>

      {/* Account Ledger Summary Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
              <th className="px-3 py-2 border-r border-slate-300">Opening Balance (₹)</th>
              <th className="px-3 py-2 border-r border-slate-300 text-right">Total Debits / Invoices (₹)</th>
              <th className="px-3 py-2 border-r border-slate-300 text-right">Total Credits / Payments (₹)</th>
              <th className="px-3 py-2 text-right font-bold bg-slate-200/60">Closing Outstanding Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10 text-xs font-semibold">
              <td className="px-3 py-2 border-r border-slate-300 font-mono">{formatDrCr(party.opening)}</td>
              <td className="px-3 py-2 border-r border-slate-300 text-right font-mono">{party.debit.toFixed(2)}</td>
              <td className="px-3 py-2 border-r border-slate-300 text-right font-mono">{party.credit.toFixed(2)}</td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50 font-mono text-sm">
                {formatDrCr(party.closing)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount In Words */}
      <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
        <strong className="text-slate-800">Amount In Words:</strong>{" "}
        <span className="font-bold text-slate-900">
          {amountInWords(party.closing.amount)}
          {party.closing.amount !== 0 && ` (${party.closing.side === "Dr" ? "Debit" : "Credit"})`}
        </span>
      </div>

      {/* Confirmation Sign-Off Slip */}
      <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-4 space-y-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
          (Please detach & return signed copy below)
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 p-3 rounded space-y-8">
            {companyName && <p className="font-bold text-slate-800">For {companyName}</p>}
            <div className="pt-4 border-t border-slate-300">
              <p className="font-semibold text-slate-700">Accounts Division Signatory</p>
            </div>
          </div>

          <div className="border border-slate-300 bg-slate-50/50 p-3 rounded space-y-4">
            <p className="font-bold text-slate-900">Client Balance Confirmation Slip:</p>
            <p className="text-[11px] text-slate-600 leading-tight">
              We hereby confirm the correctness of the closing balance of <strong>{formatDrCr(party.closing)}</strong> in our account as on <strong>{formatDate(asOnDate)}</strong>.
            </p>
            <div className="pt-4 flex justify-between items-end border-t border-slate-300 text-[11px]">
              <span>Authorized Signature</span>
              <span>Rubber Stamp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
