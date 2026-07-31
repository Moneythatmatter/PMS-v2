"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Search,
  Scale,
  Maximize2,
  Minimize2,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Filter,
  Loader2,
  BookOpen,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  Drawer,
  Modal,
  AlertBanner,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleGeneralLedgerData,
  sampleGroups,
  sampleLedgers,
  sampleVoucherTypes,
  GeneralLedgerEntry,
} from "@/app/data/accounts/generalLedgerData";
import { cn } from "@/lib/utils";

export function GeneralLedgerView() {
  // Filters Panel / Mobile Drawer Toggle
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Search Modal for Ledger (Matching WINHMS Image 3)
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");

  // Primary Selection Controls
  const [selectedGroup, setSelectedGroup] = useState("<ALL>");
  const [selectedLedger, setSelectedLedger] = useState("");
  const [selectedVoucherType, setSelectedVoucherType] = useState("<ALL>");

  // Date Range Controls
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [appliedFromDate, setAppliedFromDate] = useState("2026-04-01");
  const [appliedToDate, setAppliedToDate] = useState("2027-03-31");
  const [datePreset, setDatePreset] = useState("fy26");
  const [sortOn, setSortOn] = useState<"seqNo" | "acId">("seqNo");

  // Checkboxes matching WINHMS screenshot (Image 1 & 4)
  const [cummulativeBalance, setCummulativeBalance] = useState(true);
  const [showCompanyHeading, setShowCompanyHeading] = useState(true);
  const [pageSkipRequired, setPageSkipRequired] = useState(false);
  const [showSubLedger, setShowSubLedger] = useState(true);
  const [showDrTrn, setShowDrTrn] = useState(true);
  const [showCrTrn, setShowCrTrn] = useState(true);
  const [suppressZero, setSuppressZero] = useState(false);
  const [analysisCode, setAnalysisCode] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Action Loading & Toast State
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preset Date Range Selector
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    let newFrom = "2026-04-01";
    let newTo = "2027-03-31";
    if (preset === "fy26") {
      newFrom = "2026-04-01";
      newTo = "2027-03-31";
    } else if (preset === "q1") {
      newFrom = "2026-04-01";
      newTo = "2026-06-30";
    } else if (preset === "thisMonth") {
      newFrom = "2026-07-01";
      newTo = "2026-07-31";
    }
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Trigger Display Action
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    const ledgerLabel = selectedLedger.trim() ? selectedLedger : "All Ledgers";
    setToastMessage(`General Ledger refreshed for ${ledgerLabel} (${fromDate} to ${toDate}).`);
    setTimeout(() => {
      setIsDisplayLoading(false);
    }, 350);
  };

  // Filtered Ledger Data
  const filteredData = useMemo(() => {
    return sampleGeneralLedgerData.filter((item) => {
      // Group Filter
      if (selectedGroup !== "<ALL>" && item.group !== selectedGroup) return false;

      // Ledger Filter (If entered/selected)
      if (selectedLedger.trim() !== "") {
        const lq = selectedLedger.trim().toLowerCase();
        if (!item.ledger.toLowerCase().includes(lq)) return false;
      }

      // Voucher Type Filter
      if (selectedVoucherType !== "<ALL>" && item.trnType !== selectedVoucherType) return false;

      // DR / CR Trn Filters
      if (!showDrTrn && item.drAmt > 0) return false;
      if (!showCrTrn && item.crAmt > 0) return false;

      // Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.particulars.toLowerCase().includes(q) ||
          item.ledger.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [selectedGroup, selectedLedger, selectedVoucherType, showDrTrn, showCrTrn, searchQuery]);

  // Total Calculations
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.totalDr += item.drAmt;
        acc.totalCr += item.crAmt;
        return acc;
      },
      { totalDr: 0, totalCr: 0 }
    );
  }, [filteredData]);

  const closingBalance = totals.totalDr - totals.totalCr;

  // Filtered Ledgers for Modal Search
  const filteredModalLedgers = sampleLedgers.filter((l) =>
    l.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
  );

  // Badge Color Helper for Transaction Types
  const getTrnTypeBadgeClass = (type: string) => {
    switch (type) {
      case "Receipts":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Payments":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Journal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Opening":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  // Shared Filter Controls Component (3 Equal Cards like Trial Balance)
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Group, Ledger & Voucher Type Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
          Account & Voucher Selection
        </p>

        {/* Group Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {sampleGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Input + Binoculars Modal Button */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Ledger:</label>
          <div className="flex items-center gap-1.5">
            <TextInput
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              placeholder="Type or select ledger..."
              className="h-8 text-xs rounded-lg flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(true)}
              className="h-8 px-2.5 border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Search Ledger List"
            >
              <Search className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold">Find</span>
            </Button>
          </div>
        </div>

        {/* Voucher Type Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">Voucher Type (Vouch Ty):</label>
          <select
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {sampleVoucherTypes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Box 2: Report & Display Options */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          Report & Display Options
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={cummulativeBalance}
              onChange={(e) => setCummulativeBalance(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Cummulative Bal</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCompanyHeading}
              onChange={(e) => setShowCompanyHeading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Company Heading</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showDrTrn}
              onChange={(e) => setShowDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">DR Trn</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showCrTrn}
              onChange={(e) => setShowCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">CR Trn</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={suppressZero}
              onChange={(e) => setSuppressZero(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Suppress Zero</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showSubLedger}
              onChange={(e) => setShowSubLedger(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Sub Ledger</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={pageSkipRequired}
              onChange={(e) => setPageSkipRequired(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Page Skip</span>
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={analysisCode}
              onChange={(e) => setAnalysisCode(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px]">Analysis Code</span>
          </label>
        </div>
      </div>

      {/* Box 3: Period & Sorting */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Period & Sorting
        </p>

        {/* Date Presets */}
        <div className="flex items-center gap-1">
          {[
            { id: "fy26", label: "FY 2026-27" },
            { id: "q1", label: "Q1 Apr-Jun" },
            { id: "thisMonth", label: "This Month" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDatePreset(p.id)}
              className={cn(
                "flex-1 rounded-lg py-1 text-[11px] font-semibold transition-all border cursor-pointer select-none",
                datePreset === p.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dates Row & Display Button */}
        <div className="flex flex-wrap items-end gap-2 pt-0.5">
          <FormField label="From Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
            />
          </FormField>

          <FormField label="To Date" className="flex-1 min-w-[105px]">
            <FODatePicker
              value={toDate}
              onChange={(val) => setToDate(val)}
            />
          </FormField>

          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={isDisplayLoading}
            className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 shadow-xs shrink-0 disabled:opacity-75 cursor-pointer"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>

        {/* Sorting Touch Pills */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-700">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Sort On:</span>
          <div className="flex items-center gap-1.5 font-medium">
            {[
              { id: "seqNo", label: "Seq. No" },
              { id: "acId", label: "AC ID" },
            ].map((opt) => {
              const active = sortOn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOn(opt.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                    active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all shrink-0",
                      active
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & General Ledger"
      title="General Ledger Report"
      description="Voucher-level account transactions, debit/credit postings, and running balances."
      toast={toastMessage}
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
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("General Ledger statement exported to CSV successfully.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Filter Controls Toolbar Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Report Controls" : "Report Parameters & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Mobile Filter Drawer Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Selected Ledger Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
            Active Ledger: <span className="underline">{selectedLedger.trim() ? selectedLedger : "<ALL>"}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            FY 2026 - 27
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                General Ledger Selection Parameters
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Hide Options
            </button>
          </div>
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="General Ledger Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Ledger Filter
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Total Debit Postings (DR)"
          value={formatINR(totals.totalDr)}
          sublabel="Total period debit vouchers"
          accent="#0284c7"
          icon={TrendingUp}
        />
        <StatMiniCard
          label="Total Credit Postings (CR)"
          value={formatINR(totals.totalCr)}
          sublabel="Total period credit vouchers"
          accent="#e11d48"
          icon={TrendingDown}
        />
        <StatMiniCard
          label="Closing Running Balance"
          value={`${formatINR(Math.abs(closingBalance))} ${closingBalance >= 0 ? "Dr" : "Cr"}`}
          sublabel="Current active ledger balance"
          accent="#16a34a"
          icon={CheckCircle2}
        />
      </div>

      {/* Official Company Heading Block */}
      {showCompanyHeading && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Luxy Hotel Pvt Ltd
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            123 Grand Boulevard, City Center • GSTIN: 27AAAAA0000A1Z5
          </p>
          <div className="my-2.5 border-t border-slate-100 max-w-xs mx-auto" />
          <h2 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            GENERAL LEDGER STATEMENT {selectedLedger.trim() ? `— ${selectedLedger.toUpperCase()}` : "— ALL LEDGERS"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            For the Period: <span className="font-semibold text-slate-700">{appliedFromDate}</span> to <span className="font-semibold text-slate-700">{appliedToDate}</span>
          </p>
        </div>
      )}

      {/* Ledger Name Search Modal (WINHMS Image 3 Replica) */}
      <Modal
        open={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        title="Ledger Name Search"
      >
        <div className="space-y-3 p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              placeholder="Search Ledger Name (e.g. YES BANK, Cash, Yatra...)"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 font-medium"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
            {filteredModalLedgers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No ledgers match your search.</div>
            ) : (
              filteredModalLedgers.map((lName) => (
                <button
                  key={lName}
                  type="button"
                  onClick={() => {
                    setSelectedLedger(lName);
                    setLedgerModalOpen(false);
                  }}
                  className={cn(
                    "w-full px-3.5 py-2 text-left text-xs font-medium transition-colors flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-900",
                    selectedLedger === lName ? "bg-amber-100/80 font-bold text-amber-900" : "text-slate-700"
                  )}
                >
                  <span>{lName}</span>
                  {selectedLedger === lName && <span className="text-[10px] uppercase font-bold text-amber-800">Selected</span>}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main General Ledger Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        {/* Table Search Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                General Ledger Transactions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Double click or tap any voucher row to view details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voucher # or particulars..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200 shrink-0">
              {filteredData.length} records
            </span>
          </div>
        </div>

        {/* Desktop Table Layout (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            {/* Table Multi-Header */}
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                <th className="px-3.5 py-2.5 border-r border-slate-200 w-28">Vouch Dt</th>
                <th className="px-3.5 py-2.5 border-r border-slate-200 w-32">Vouch No</th>
                <th className="px-4 py-2.5 border-r border-slate-200 min-w-[220px]">Particulars</th>
                <th className="px-3.5 py-2.5 border-r border-slate-200 w-28 text-center">Trn Type</th>
                <th className="px-3.5 py-2.5 border-r border-slate-200 text-right w-32">DR_Amt (₹)</th>
                <th className="px-3.5 py-2.5 border-r border-slate-200 text-right w-32">CR_Amt (₹)</th>
                {cummulativeBalance && (
                  <th className="px-3.5 py-2.5 text-right w-36">Running Bal (₹)</th>
                )}
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                  onDoubleClick={() => alert(`Viewing voucher details for ${row.vouchNo}`)}
                >
                  <td className="px-3.5 py-2.5 border-r border-slate-100 text-slate-600 font-medium">
                    {row.vouchDt}
                  </td>
                  <td className="px-3.5 py-2.5 border-r border-slate-100 font-bold text-slate-800">
                    {row.vouchNo}
                  </td>
                  <td className="px-4 py-2.5 border-r border-slate-100 font-semibold text-slate-900">
                    {row.particulars}
                  </td>
                  <td className="px-3.5 py-2.5 border-r border-slate-100 text-center">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                        getTrnTypeBadgeClass(row.trnType)
                      )}
                    >
                      {row.trnType}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 border-r border-slate-100 text-right font-semibold text-slate-800">
                    {row.drAmt > 0 ? formatINR(row.drAmt) : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 border-r border-slate-100 text-right font-semibold text-slate-800">
                    {row.crAmt > 0 ? formatINR(row.crAmt) : "-"}
                  </td>
                  {cummulativeBalance && (
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-900 bg-slate-50/50">
                      {formatINR(row.runningBalance)} {row.balanceType}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100/90 font-black text-xs border-t-2 border-slate-300 text-slate-900 uppercase">
                <td colSpan={4} className="px-4 py-2.5 text-right border-r border-slate-200">
                  TOTAL GENERAL LEDGER POSTINGS:
                </td>
                <td className="px-3.5 py-2.5 text-right border-r border-slate-200 text-slate-900">
                  {formatINR(totals.totalDr)}
                </td>
                <td className="px-3.5 py-2.5 text-right border-r border-slate-200 text-slate-900">
                  {formatINR(totals.totalCr)}
                </td>
                {cummulativeBalance && (
                  <td className="px-3.5 py-2.5 text-right text-emerald-950 font-black bg-emerald-100/70">
                    {formatINR(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Stacked Card View (md:hidden) */}
        <div className="md:hidden space-y-3">
          {filteredData.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{row.vouchNo}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                    getTrnTypeBadgeClass(row.trnType)
                  )}
                >
                  {row.trnType}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800">{row.particulars}</p>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Voucher Date</span>
                  <span className="font-semibold">{row.vouchDt}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Amount</span>
                  <span className="font-bold text-slate-900">
                    {row.drAmt > 0 ? `Dr ${formatINR(row.drAmt)}` : `Cr ${formatINR(row.crAmt)}`}
                  </span>
                </div>
              </div>

              {cummulativeBalance && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-emerald-900 bg-emerald-50/50 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl">
                  <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Running Balance:</span>
                  <span>{formatINR(row.runningBalance)} {row.balanceType}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ModulePageShell>
  );
}
