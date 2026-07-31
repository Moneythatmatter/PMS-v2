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
  Users,
  ChevronDown,
  X,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Info,
  Receipt,
  FileCheck,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  samplePartyGroups,
  sampleMSMETypes,
  sampleOutstandingBillsData,
  OutstandingBillItem,
} from "@/app/data/accounts/outstandingBillsAgingData";
import { cn } from "@/lib/utils";

// Interface extending bill item for Party Bills ledger view
export interface PartyBillLedgerItem extends OutstandingBillItem {
  billAmt: number;
  settledAmt: number;
  status: "Cleared" | "Partial" | "Pending";
}

export const samplePartyBillsLedgerData: PartyBillLedgerItem[] = sampleOutstandingBillsData.map((b) => {
  const settled = b.id === "ob-101" ? 50000 : b.id === "ob-102" ? 50000 : b.id === "ob-107" ? 0 : 0;
  const billTotal = b.balanceAmt + settled;
  const status = b.balanceAmt === 0 ? "Cleared" : settled > 0 ? "Partial" : "Pending";
  return {
    ...b,
    billAmt: billTotal,
    settledAmt: settled,
    status,
  };
});

export function PartyBillsView() {
  // Desktop & Mobile filter state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // WINHMS Parameters
  const [includeAR, setIncludeAR] = useState(true);
  const [includeAP, setIncludeAP] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [allParties, setAllParties] = useState(true);
  const [asOnDate, setAsOnDate] = useState("2026-07-24");

  // Bill Filter Mode
  const [pendingBillsOnly, setPendingBillsOnly] = useState(true);

  // Transaction Filters
  const [includeDrTrn, setIncludeDrTrn] = useState(true);
  const [includeCrTrn, setIncludeCrTrn] = useState(true);
  const [selectedMSME, setSelectedMSME] = useState("<All>");

  // Search & Loading State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDisplayLoading, setIsDisplayLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Row Details Drawer State
  const [selectedBillDetail, setSelectedBillDetail] = useState<PartyBillLedgerItem | null>(null);

  // Bills Data State
  const [bills, setBills] = useState<PartyBillLedgerItem[]>(samplePartyBillsLedgerData);

  // Filtered Bills Logic
  const filteredBills = useMemo(() => {
    return bills.filter((item) => {
      // Module AR / AP
      if (!includeAR && item.moduleType === "AR") return false;
      if (!includeAP && item.moduleType === "AP") return false;

      // Group
      if (selectedGroup !== "All Groups" && item.partyGroup !== selectedGroup) {
        return false;
      }

      // Pending Bills Only
      if (pendingBillsOnly && item.balanceAmt <= 0) {
        return false;
      }

      // MSME Type
      if (selectedMSME !== "<All>" && item.msmeType !== selectedMSME) {
        return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.refName.toLowerCase().includes(q) ||
          item.refType.toLowerCase().includes(q) ||
          item.partyGroup.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    bills,
    includeAR,
    includeAP,
    selectedGroup,
    pendingBillsOnly,
    selectedMSME,
    searchQuery,
  ]);

  // Total Summary Calculations
  const totalBillAmt = useMemo(() => filteredBills.reduce((sum, b) => sum + b.billAmt, 0), [filteredBills]);
  const totalSettledAmt = useMemo(() => filteredBills.reduce((sum, b) => sum + b.settledAmt, 0), [filteredBills]);
  const totalBalanceAmt = useMemo(() => filteredBills.reduce((sum, b) => sum + b.balanceAmt, 0), [filteredBills]);
  const overdueCount = useMemo(() => filteredBills.filter((b) => b.dueDays > 0).length, [filteredBills]);

  // Handle Display Button
  const handleDisplayReport = () => {
    setIsDisplayLoading(true);
    setTimeout(() => {
      setIsDisplayLoading(false);
      setToastMessage(`Updated party bills report for ${filteredBills.length} records as on ${asOnDate}.`);
    }, 300);
  };

  // Shared WINHMS Parameter Form Layout
  const FilterFormContent = () => (
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
        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {samplePartyGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* All Parties Checkbox */}
        <div className="lg:col-span-2 flex items-center gap-1.5 font-semibold text-slate-700">
          <input
            type="checkbox"
            id="chk-all-parties-bills"
            checked={allParties}
            onChange={(e) => setAllParties(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
          />
          <label htmlFor="chk-all-parties-bills" className="cursor-pointer">
            All Parties
          </label>
        </div>

        {/* As On Date & Display Button */}
        <div className="lg:col-span-4 flex items-center gap-2 justify-end">
          <span className="font-semibold text-slate-600 shrink-0">As On:</span>
          <FODatePicker value={asOnDate} onChange={setAsOnDate} className="w-32" />
          <Button
            type="button"
            size="sm"
            onClick={handleDisplayReport}
            disabled={isDisplayLoading}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            {isDisplayLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Display
          </Button>
        </div>
      </div>

      {/* Row 2: Pending Check, Transaction Checks, MSME Filter */}
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

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDrTrn}
              onChange={(e) => setIncludeDrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>DR Trn</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCrTrn}
              onChange={(e) => setIncludeCrTrn(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>CR Trn</span>
          </label>
        </div>

        <div className="lg:col-span-4 flex items-center gap-2">
          <span className="font-semibold text-slate-600 shrink-0">MSME Type:</span>
          <select
            value={selectedMSME}
            onChange={(e) => setSelectedMSME(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {sampleMSMETypes.map((m) => (
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
            onClick={() => alert("Party Bills report exported to CSV.")}
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
            Group: {selectedGroup}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {asOnDate}
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
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Party Bills Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
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
          sublabel={`${filteredBills.length} party bills`}
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
              placeholder="Search voucher # or party..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* WINHMS Party Bills Table Format */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchNo</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">VouchDt</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200 text-center">Ref Type</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Ref Name</th>
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
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No party bills found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((row) => (
                  <tr
                    key={row.id}
                    onDoubleClick={() => setSelectedBillDetail(row)}
                    className="hover:bg-amber-50/70 transition-colors cursor-pointer text-[11px]"
                    title="Double click to view party bill details"
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-900 border-r border-slate-100">{row.vouchNo}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.vouchDt}</td>
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
                    <td className="px-3 py-2.5 font-semibold text-slate-800 border-r border-slate-100">{row.refName}</td>
                    <td className="px-3.5 py-2.5 border-r border-slate-100">
                      <span className="font-bold text-slate-900 block">{row.refName}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">{row.partyGroup} • {row.msmeType}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium border-r border-slate-100">{row.dueDate}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800 border-r border-slate-100">
                      {formatINR(row.billAmt)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-700 border-r border-slate-100">
                      {row.settledAmt > 0 ? formatINR(row.settledAmt) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 bg-slate-50">
                      {formatINR(row.balanceAmt)}
                    </td>
                    <td className="px-2.5 py-2.5 text-center border-r border-slate-100 font-bold text-slate-700">
                      {row.dueDays} d
                    </td>
                    <td className="px-2.5 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          row.status === "Cleared"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "Partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredBills.length > 0 && (
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
        onClose={() => setSelectedBillDetail(null)}
        title="Party Bill Ledger Details"
      >
        {selectedBillDetail && (
          <div className="p-4 space-y-4 text-xs font-sans">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedBillDetail.refName}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedBillDetail.status === "Cleared"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedBillDetail.status === "Partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  )}
                >
                  {selectedBillDetail.status}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Group: <strong>{selectedBillDetail.partyGroup}</strong> • MSME: <strong>{selectedBillDetail.msmeType}</strong>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-700">
              <div className="flex justify-between">
                <span>Voucher No:</span>
                <strong className="text-slate-900">{selectedBillDetail.vouchNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Voucher Date:</span>
                <span>{selectedBillDetail.vouchDt}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span>{selectedBillDetail.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Original Bill Amount:</span>
                <strong>{formatINR(selectedBillDetail.billAmt)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Settled Amount:</span>
                <span className="text-emerald-700 font-semibold">{formatINR(selectedBillDetail.settledAmt)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Remaining Outstanding:</span>
                <span className="text-emerald-800 font-bold">
                  {formatINR(selectedBillDetail.balanceAmt)}
                </span>
              </div>
            </div>

            {selectedBillDetail.remarks && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900 text-[11px]">
                <strong>Audit Note:</strong> {selectedBillDetail.remarks}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
