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
  FileText,
  PieChart,
  Loader2,
  Info,
  CheckSquare,
  Square,
  Eye,
  Save,
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
import {
  accCoveringLetterService,
  accPartyService,
  type CoveringLetter,
  type PartyBill,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import {
  ALL_GROUPS,
  CompanyLetterhead,
  LETTER_PARTY_GROUPS,
  PrintConfirmDialog,
  TableStatusRow,
  companyDisplayName,
  useLetterheadCompany,
  type LetterToast,
} from "@/components/accounts/ReminderLetterView";
import {
  CoveringLetterSheet,
  coveringLetterDoc,
  type CoveringLetterDoc,
} from "@/components/accounts/BillCoveringLetterPrintView";
import { cn } from "@/lib/utils";

type CandidateParams = { partyGroup: string; partyId: string; asOnDate: string; forTheDay: boolean };

export function BillCoveringLetterView() {
  const router = useRouter();
  const { lookups, error: lookupsError } = useAccLookups();
  const letterhead = useLetterheadCompany();

  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parameters (applied on Display)
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS);
  const [partyId, setPartyId] = useState("");
  const [asOnDate, setAsOnDate] = useState(todayIso());
  const [forTheDay, setForTheDay] = useState(false);

  // Covering letter date & remarks (letter number is assigned by the server)
  const [trnDt, setTrnDt] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [savedLetter, setSavedLetter] = useState<CoveringLetter | null>(null);
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useState<CandidateParams>(() => ({
    partyGroup: "",
    partyId: "",
    asOnDate: todayIso(),
    forTheDay: false,
  }));

  const { data, loading, error, reload } = useAccQuery(
    () =>
      accCoveringLetterService.candidates({
        partyGroup: params.partyGroup || undefined,
        partyId: params.partyId || undefined,
        asOnDate: params.asOnDate,
        from: params.forTheDay ? params.asOnDate : undefined,
        to: params.forTheDay ? params.asOnDate : undefined,
      }),
    [params],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Preview & Printer Dialog State
  const [previewMode, setPreviewMode] = useState<"draft" | "saved" | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<LetterToast | null>(null);

  const partyOptions = useMemo(
    () =>
      (lookups?.parties ?? []).filter((p) => selectedGroup === ALL_GROUPS || p.partyGroup === selectedGroup),
    [lookups, selectedGroup],
  );

  const bills = useMemo(() => data ?? [], [data]);

  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills.filter(
      (item) =>
        !q ||
        item.billNo.toLowerCase().includes(q) ||
        item.refType.toLowerCase().includes(q) ||
        (item.partyName ?? "").toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q),
    );
  }, [bills, searchQuery]);

  const selectedBillsList = useMemo(() => bills.filter((b) => selectedIds.has(b.id)), [bills, selectedIds]);
  const selectedPartyId = selectedBillsList[0]?.partyId ?? null;
  const primaryBill = selectedBillsList[0] ?? null;

  const totalSelectedAmt = useMemo(
    () => selectedBillsList.reduce((sum, b) => sum + b.amount, 0),
    [selectedBillsList],
  );

  // Recipient details for the draft preview
  const { data: selectedParty } = useAccQuery(
    () => (selectedPartyId ? accPartyService.get(selectedPartyId) : Promise.resolve(null)),
    [selectedPartyId],
  );

  const handleToggleSelect = (bill: PartyBill) => {
    const next = new Set(selectedIds);
    if (next.has(bill.id)) {
      next.delete(bill.id);
    } else {
      if (selectedPartyId && bill.partyId !== selectedPartyId) {
        setToast({
          message: `All bills in a covering letter must belong to one party (${primaryBill?.partyName ?? "selected party"}). Clear the selection to switch party.`,
          variant: "error",
        });
        return;
      }
      next.add(bill.id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    const partyIds = new Set(filteredBills.map((b) => b.partyId));
    if (partyIds.size > 1 || (selectedPartyId && !partyIds.has(selectedPartyId) && partyIds.size > 0)) {
      setToast({
        message: "Bills from multiple parties are listed. Filter by a single party before using Select All.",
        variant: "error",
      });
      return;
    }
    setSelectedIds(new Set([...selectedIds, ...filteredBills.map((b) => b.id)]));
  };

  const handleClearAll = () => setSelectedIds(new Set());

  const handleDisplayReport = () => {
    setSelectedIds(new Set());
    setPreviewMode(null);
    setParams({
      partyGroup: selectedGroup === ALL_GROUPS ? "" : selectedGroup,
      partyId,
      asOnDate,
      forTheDay,
    });
    setMobileFilterOpen(false);
  };

  const handleSaveCoveringLetter = async () => {
    if (selectedBillsList.length === 0) return;
    setSaving(true);
    try {
      const letter = await accCoveringLetterService.create({
        letterDate: trnDt,
        billIds: selectedBillsList.map((b) => b.id),
        remarks: remarks.trim() || undefined,
      });
      setSavedLetter(letter);
      setSelectedIds(new Set());
      setRemarks("");
      setToast({
        message: `Saved Bill Covering Letter '${letter.letterNo}' with ${letter.billsCount} enclosed bill(s).`,
        variant: "success",
      });
      setPreviewMode("saved");
      void reload();
    } catch (e) {
      setToast({ message: accErrorMessage(e), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setPreviewMode("saved");
    setTimeout(() => window.print(), 150);
  };

  const draftDoc: CoveringLetterDoc | null = primaryBill
    ? {
        key: "draft",
        letterNo: null,
        letterDate: trnDt,
        partyName: primaryBill.partyName ?? "",
        partyAddress: selectedParty
          ? [selectedParty.addressLine1, selectedParty.addressLine2, selectedParty.city, selectedParty.state, selectedParty.postalCode]
              .filter(Boolean)
              .join(", ")
          : "",
        partyGstin: selectedParty?.gstin ?? "",
        contactPersonName: selectedParty?.contactPersonName ?? "",
        totalAmount: totalSelectedAmt,
        bills: selectedBillsList.map((b) => ({
          key: b.id,
          billNo: b.billNo,
          billDate: b.billDate,
          dueDate: b.dueDate,
          details: b.details,
          amount: b.amount,
        })),
      }
    : null;

  const previewDoc =
    previewMode === "saved" && savedLetter ? coveringLetterDoc(savedLetter) : previewMode === "draft" ? draftDoc : null;

  const companyName = companyDisplayName(letterhead.company);
  const trnNoLabel = savedLetter?.letterNo ?? "Auto on save";

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

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
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
      </div>

      {/* Row 2: For the Day, Trn No, Trn Dt, Remarks */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700">
        <div className="lg:col-span-2 flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={forTheDay}
              onChange={(e) => setForTheDay(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>For the Day</span>
          </label>
        </div>

        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Trn No:</span>
          <input
            type="text"
            value={savedLetter?.letterNo ?? ""}
            readOnly
            placeholder="Auto-assigned on save"
            className="h-7 font-mono font-bold text-slate-900 w-40 rounded border border-slate-300 bg-slate-100 px-2 text-xs focus:outline-none"
          />
        </div>

        <div className="lg:col-span-3 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Trn Dt:</span>
          <FODatePicker value={trnDt} onChange={setTrnDt} className="w-32" />
        </div>

        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Remarks:</span>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional dispatch remarks..."
            className="h-7 flex-1 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Party Outstanding"
      title="Bill Covering Letter"
      description="Generate formal bill covering letters for client invoice submission and dispatch tracking."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Party Outstanding", href: "/accounts/party-outstanding" },
        { label: "Bill Covering Letter" },
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
            disabled={!savedLetter}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Covering Letter {savedLetter ? `(${savedLetter.letterNo})` : ""}
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
            <span>{showFilters ? "Hide Options" : "Covering Letter Parameters & Options"}</span>
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
            Trn No: {trnNoLabel}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {formatDate(params.asOnDate)}
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
                WINHMS Bill Covering Letter Parameters & Options
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
        title="Covering Letter Options"
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
          label="Selected Enclosed Bills"
          value={`${selectedBillsList.length} Bills`}
          sublabel="Attached to covering letter"
          accent="#0284c7"
          icon={FileText}
        />
        <StatMiniCard
          label="Total Enclosed Amount"
          value={formatINR(totalSelectedAmt)}
          sublabel="Net bill total"
          accent="#16a34a"
          icon={PieChart}
        />
        <StatMiniCard
          label="Recipient Client"
          value={primaryBill?.partyName ?? "—"}
          sublabel={primaryBill?.partyGroup ?? "Select bills below"}
          accent="#f59e0b"
          icon={Users}
        />
        <StatMiniCard
          label="Voucher Reference"
          value={trnNoLabel}
          sublabel={`Dated ${formatDate(savedLetter?.letterDate ?? trnDt)}`}
          accent="#8b5cf6"
          icon={FileSpreadsheet}
        />
      </div>

      {/* Main Table Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Bill Covering Letter Enclosed Bills Table ({filteredBills.length} records)
              </h2>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Open receivable bills not yet sent. Select bills of one party to enclose in the covering letter
            </p>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bill # or ref type..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-28 border-r border-slate-200">Bill No</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">Bill Dt</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Ref Type</th>
                <th className="px-3.5 py-2.5 min-w-[260px] border-r border-slate-200">Details</th>
                <th className="px-3 py-2.5 text-right w-36 border-r border-slate-200 font-bold bg-slate-200/50">Amount</th>
                <th className="px-3 py-2.5 text-center w-20">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading || error || filteredBills.length === 0 ? (
                <TableStatusRow
                  colSpan={6}
                  loading={loading}
                  error={error}
                  onRetry={() => void reload()}
                  emptyText="No pending receivable bills found matching criteria."
                />
              ) : (
                filteredBills.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleToggleSelect(row)}
                    className={cn(
                      "hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]",
                      selectedPartyId && row.partyId !== selectedPartyId && "opacity-50"
                    )}
                  >
                    <td className="px-3 py-2.5 font-bold font-mono text-slate-900 border-r border-slate-100">{row.billNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{formatDate(row.billDate)}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800 border-r border-slate-100">{row.refType || "—"}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.partyName ?? "—"}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {[row.details, `Due ${formatDate(row.dueDate)}`].filter(Boolean).join(" • ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.amount)}
                      {row.balance < row.amount && (
                        <span className="block text-[10px] font-medium text-slate-500">Bal {formatINR(row.balance)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleToggleSelect(row)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && !error && filteredBills.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300 text-xs">
                  <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-[10px] tracking-wider border-r border-slate-300">
                    Total Enclosed Bills Amount ({selectedBillsList.length} bills):
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
              disabled={selectedBillsList.length === 0 || saving}
              onClick={() => void handleSaveCoveringLetter()}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save Voucher
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={selectedBillsList.length === 0}
              onClick={() => setPreviewMode("draft")}
              className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Letter
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!savedLetter}
              onClick={() => setShowPrinterDialog(true)}
              title={savedLetter ? undefined : "Save the covering letter before printing"}
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
        documentsLabel={savedLetter ? `${savedLetter.letterNo} (${savedLetter.billsCount} bills)` : "—"}
        onConfirm={handleConfirmPrinterDialog}
        onCancel={() => setShowPrinterDialog(false)}
      />

      {/* Formatted Bill Covering Letter Printable Document Sheet Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  WINHMS Bill Covering Letter Sheet ({previewDoc.letterNo ?? "Draft"})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {previewMode === "saved" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowPrinterDialog(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print Letter
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => void handleSaveCoveringLetter()}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save Voucher
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewMode(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <CoveringLetterSheet
              doc={previewDoc}
              companyName={companyName}
              letterhead={<CompanyLetterhead {...letterhead} />}
            />
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
