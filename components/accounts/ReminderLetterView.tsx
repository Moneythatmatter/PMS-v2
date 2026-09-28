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
  AlertCircle,
  PieChart,
  Loader2,
  Info,
  Mail,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  accCompanyService,
  accReportService,
  type Company,
  type ReminderParty,
} from "@/services/accounts";
import { formatDate, todayIso, useAccLookups, useAccQuery } from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared helpers for the letters & advices screens
// ---------------------------------------------------------------------------

export const LETTER_PARTY_GROUPS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Corporate Debtors",
  "Travel Agents",
  "Credit Card Company",
  "City Ledger",
] as const;

export const ALL_GROUPS = "All Groups";

export type LetterToast = { message: string; variant: "success" | "error" };

/** First active company (or first company) of the property, used for letterheads. */
export function useLetterheadCompany() {
  const { data, loading, error } = useAccQuery(() => accCompanyService.list(), []);
  const company = data?.find((c) => c.status === "Active") ?? data?.[0] ?? null;
  return { company, loading, error };
}

export function companyDisplayName(company: Company | null): string {
  return company?.legalName || company?.tradeName || "";
}

export function CompanyLetterhead({ company, loading, error }: { company: Company | null; loading?: boolean; error?: string | null }) {
  if (!company) {
    return (
      <div className="text-center space-y-1 border-b border-slate-300 pb-3">
        <p className="text-[11px] font-semibold text-amber-700">
          {loading
            ? "Loading company details..."
            : error
              ? `Company details unavailable: ${error}`
              : "No company profile found. Create one under Accounts → Company Creation to print the letterhead."}
        </p>
      </div>
    );
  }
  const stateLine = [company.state, company.pincode].filter(Boolean).join(" ");
  const address = [company.addressLine1, company.addressLine2, company.city, stateLine].filter(Boolean).join(", ");
  const phone = [company.mobile, company.telephone].filter(Boolean).join(" / ");
  const contact = [
    phone ? `Phone: ${phone}` : "",
    company.email ? `E-Mail: ${company.email}` : "",
    company.website ? `Web: ${company.website}` : "",
  ]
    .filter(Boolean)
    .join(" • ");
  return (
    <div className="text-center space-y-1 border-b border-slate-300 pb-3">
      <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">{companyDisplayName(company)}</h1>
      {address && <p className="text-[11px] text-slate-600 leading-tight">{address}</p>}
      {contact && <p className="text-[11px] text-slate-600">{contact}</p>}
      {(company.gstNumber || company.state) && (
        <p className="text-[11px] font-bold text-slate-800">
          {company.gstNumber && <>GSTIN: {company.gstNumber} </>}
          {company.state && <>State: {company.state.toUpperCase()}</>}
        </p>
      )}
    </div>
  );
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function integerWords(n: number): string {
  if (n === 0) return "";
  if (n >= 1e7) return `${integerWords(Math.floor(n / 1e7))} Crore ${integerWords(n % 1e7)}`.trim();
  if (n >= 1e5) return `${twoDigitWords(Math.floor(n / 1e5))} Lakh ${integerWords(n % 1e5)}`.trim();
  if (n >= 1000) return `${twoDigitWords(Math.floor(n / 1000))} Thousand ${integerWords(n % 1000)}`.trim();
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? twoDigitWords(rest) : ""].filter(Boolean).join(" ");
}

/** Indian-system amount in words, e.g. 145000.5 → "Rupees One Lakh Forty Five Thousand and Fifty Paise Only." */
export function amountInWords(value: number): string {
  const abs = Math.round(Math.abs(value) * 100);
  const rupees = Math.floor(abs / 100);
  const paise = abs % 100;
  return `Rupees ${integerWords(rupees) || "Zero"}${paise ? ` and ${twoDigitWords(paise)} Paise` : ""} Only.`;
}

export function TableStatusRow({
  colSpan,
  loading,
  error,
  onRetry,
  emptyText,
}: {
  colSpan: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyText: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-slate-400 font-medium">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </span>
        ) : error ? (
          <span className="inline-flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-rose-700">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry} className="h-7 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          </span>
        ) : (
          emptyText
        )}
      </td>
    </tr>
  );
}

/** Confirmation before handing the documents to the browser print dialog. */
export function PrintConfirmDialog({
  open,
  documentsLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  documentsLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:hidden">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-xs font-bold text-slate-800">Print</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 font-sans text-xs">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[11px] space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Target Documents:</span>
              <span className="font-semibold text-slate-800">{documentsLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500">Choose the printer in your browser&apos;s print dialog.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="px-4 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            OK
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="px-4 h-7 text-xs font-semibold text-slate-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reminder letter view
// ---------------------------------------------------------------------------

type ReminderParams = { asOnDate: string; partyGroup: string; partyId: string; minOverdueDays: number };

export function ReminderLetterView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();
  const letterhead = useLetterheadCompany();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Reminder parameters (applied on Display)
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [allParties, setAllParties] = useState(true);
  const [partyId, setPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());
  const [filterAgeDays, setFilterAgeDays] = useState(false);
  const [minOverdueDays, setMinOverdueDays] = useState(30);

  const [params, setParams] = useState<ReminderParams>(() => ({
    asOnDate: todayIso(),
    partyGroup: "",
    partyId: "",
    minOverdueDays: 0,
  }));

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accReportService.reminderLetters({
        asOnDate: params.asOnDate,
        partyGroup: params.partyGroup || undefined,
        partyId: params.partyId || undefined,
        minOverdueDays: params.minOverdueDays || undefined,
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
    return (data?.parties ?? []).filter(
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
    () => selectedPartiesList.reduce((sum, p) => sum + p.totalOverdue, 0),
    [selectedPartiesList],
  );

  const highPriorityOverdue = useMemo(
    () =>
      filteredParties.reduce(
        (sum, p) => sum + p.bills.filter((b) => b.overdueDays > 30).reduce((s, b) => s + b.balance, 0),
        0,
      ),
    [filteredParties],
  );

  const handleDisplayReport = () => {
    if (!allParties && !partyId) {
      setToast({ message: "Select a party or tick 'All Parties'.", variant: "error" });
      return;
    }
    setSelectedIds(new Set());
    setPreviewOpen(false);
    setParams({
      asOnDate,
      partyGroup: selectedGroup === ALL_GROUPS ? "" : selectedGroup,
      partyId: allParties ? "" : partyId,
      minOverdueDays: filterAgeDays ? Math.max(0, minOverdueDays) : 0,
    });
    setMobileFilterOpen(false);
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setPreviewOpen(true);
    setTimeout(() => window.print(), 150);
  };

  const companyName = companyDisplayName(letterhead.company);
  const letterDate = data?.asOnDate ?? params.asOnDate;

  const filterForm = (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Receivables only */}
        <div className="lg:col-span-2 flex items-center gap-3 font-bold text-slate-800">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-800">
            AR (Receivables)
          </span>
        </div>

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
        <div className="lg:col-span-2 flex flex-col gap-1.5 font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="chk-all-parties-reminder"
              checked={allParties}
              onChange={(e) => setAllParties(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <label htmlFor="chk-all-parties-reminder" className="cursor-pointer">
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

        {/* As On Date & Display Button */}
        <div className="lg:col-span-3 flex items-center gap-2">
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

        {/* Filter Age Days Box */}
        <div className="lg:col-span-2 flex items-center justify-end gap-3 text-[11px] font-semibold text-slate-700">
          <div className="space-y-1 border-l border-slate-200 pl-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={filterAgeDays}
                onChange={(e) => setFilterAgeDays(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Min Overdue Days</span>
            </label>
            <input
              type="number"
              min={0}
              value={minOverdueDays}
              disabled={!filterAgeDays}
              onChange={(e) => setMinOverdueDays(Number(e.target.value) || 0)}
              className="h-7 w-20 rounded border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Reminder Letter"
      description="Generate, preview, and print formal payment reminder letters for party accounts with overdue outstanding balances."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Reminder Letter" },
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
            Print Reminder Letters ({selectedPartiesList.length})
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
            <span>{showFilters ? "Hide Options" : "Reminder Parameters & Options"}</span>
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
            <Mail className="h-3.5 w-3.5 text-emerald-700" />
            Selected: {selectedPartiesList.length} / {filteredParties.length} Parties
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {formatDate(letterDate)}
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
                WINHMS Reminder Letter Parameters & Options
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
        title="Reminder Options"
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
          sublabel="Targeted for reminders"
          accent="#0284c7"
          icon={Users}
        />
        <StatMiniCard
          label="Total Outstanding Amount"
          value={formatINR(totalSelectedAmt)}
          sublabel="Selected party overdue balance"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="High Priority Overdue"
          value={formatINR(highPriorityOverdue)}
          sublabel="Exceeding 30 days"
          accent="#e11d48"
          icon={AlertCircle}
        />
        <StatMiniCard
          label="Letters Ready to Generate"
          value={`${selectedPartiesList.length} Letters`}
          sublabel="Formatted for print"
          accent="#8b5cf6"
          icon={Mail}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Party Accounts for Reminder Letter ({filteredParties.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Parties with overdue receivable bills. Select parties to preview or print reminder letters
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
                <th className="px-3 py-2.5 text-center w-24 border-r border-slate-200">Max Overdue</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Total Overdue Amt</th>
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
                  emptyText="No parties with overdue bills found for the selected criteria."
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
                        {[row.partyGroup, row.contactPersonName && `Contact: ${row.contactPersonName}`, row.phone]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-rose-700 border-r border-slate-100">
                      {row.maxOverdueDays} d
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.totalOverdue)}
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
                    Total Selected Balance ({selectedPartiesList.length} parties):
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200/60 border-r border-slate-300">
                    {formatINR(totalSelectedAmt)}
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
              Preview Letter
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
        documentsLabel={`${selectedPartiesList.length} Reminder Letters`}
        onConfirm={handleConfirmPrinterDialog}
        onCancel={() => setShowPrinterDialog(false)}
      />

      {/* Formatted Reminder Letter Printable Document Modal */}
      {previewOpen && selectedPartiesList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Reminder Letter Sheet ({selectedPartiesList.length === 1 ? selectedPartiesList[0].partyName : `${selectedPartiesList.length} parties`})
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

            {selectedPartiesList.map((party) => (
              <ReminderLetterSheet
                key={party.partyId}
                party={party}
                asOnDate={letterDate}
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

function ReminderLetterSheet({
  party,
  asOnDate,
  companyName,
  letterhead,
}: {
  party: ReminderParty;
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
          {(party.contactPersonName || party.phone) && (
            <p className="text-slate-600 text-[11px]">
              Attn: {party.contactPersonName || "Accounts"}
              {party.phone && ` (${party.phone})`}
            </p>
          )}
          {party.email && <p className="text-slate-600 text-[11px]">E-Mail: {party.email}</p>}
        </div>
        <div className="text-right space-y-1">
          <p className="font-semibold text-slate-700">Date: {formatDate(asOnDate)}</p>
          <p className="font-mono text-[11px] text-slate-500">Ref: REM/{party.partyCode}/{asOnDate}</p>
        </div>
      </div>

      {/* Subject Line */}
      <div className="bg-slate-100 p-2 text-center rounded border border-slate-200">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          SUBJECT: PAYMENT REMINDER - OUTSTANDING OVERDUE BILLS
        </h2>
      </div>

      {/* Body Text */}
      <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
        <p>Dear Sir/Madam,</p>
        <p>
          We draw your kind attention to the following overdue bills outstanding in your account as on <strong>{formatDate(asOnDate)}</strong>. Kindly arrange for immediate payment at your earliest convenience.
        </p>
      </div>

      {/* Overdue Bills Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
              <th className="px-3 py-1.5 border-r border-slate-300">Bill No</th>
              <th className="px-3 py-1.5 border-r border-slate-300">Bill Date</th>
              <th className="px-3 py-1.5 border-r border-slate-300">Due Date</th>
              <th className="px-3 py-1.5 border-r border-slate-300 text-center">Overdue Days</th>
              <th className="px-3 py-1.5 text-right border-r border-slate-300 w-28">Bill Amt (₹)</th>
              <th className="px-3 py-1.5 text-right w-28">Balance Amt (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {party.bills.map((b) => (
              <tr key={b.billId} className="h-8">
                <td className="px-3 py-1.5 border-r border-slate-200 font-bold font-mono">{b.billNo}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">{formatDate(b.billDate)}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-slate-700">{formatDate(b.dueDate)}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-center font-bold text-rose-700">
                  {b.overdueDays} d
                </td>
                <td className="px-3 py-1.5 text-right border-r border-slate-200 font-semibold">{b.amount.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-900">{b.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold border-t border-slate-300 text-xs">
              <td colSpan={5} className="px-3 py-2 text-right uppercase font-bold text-slate-800">
                Total Overdue Amount:
              </td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-200/50">
                {party.totalOverdue.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount In Words */}
      <div className="border border-slate-300 p-2.5 text-xs bg-slate-50/50">
        <strong className="text-slate-800">Amount In Words:</strong>{" "}
        <span className="font-bold text-slate-900">{amountInWords(party.totalOverdue)}</span>
      </div>

      {/* Signoff */}
      <div className="pt-8 flex justify-between items-end text-xs text-slate-800 font-semibold">
        <div>
          <p>Thanking You,</p>
          <p className="font-bold">Accounts & Finance Division</p>
        </div>
        <div className="text-center space-y-8">
          {companyName && <p className="font-bold">For {companyName}</p>}
          <p className="border-t border-slate-400 pt-1 px-4">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
