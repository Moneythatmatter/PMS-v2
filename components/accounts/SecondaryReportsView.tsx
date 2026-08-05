"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  FileCheck2,
  Percent,
  Landmark,
  Users,
  Building2,
  ShieldCheck,
  Building,
  CheckCircle2,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  SlidersHorizontal,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleReportCatalogData,
  sampleGSTReportRows,
  StatutoryReportCard,
} from "@/app/data/accounts/reports2Data";
import { cn } from "@/lib/utils";

export function SecondaryReportsView() {
  // Date Filters State
  const [dateFrom, setDateFrom] = useState("01/04/2026");
  const [dateTo, setDateTo] = useState("31/03/2027");

  // Selected Category Filter ('All' | 'GST' | 'BRS' | 'Party' | 'CostCenter' | 'Audit')
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Selected Active Report Card for Data Preview
  const [activeReport, setActiveReport] = useState<StatutoryReportCard>(
    sampleReportCatalogData[0]
  );

  // Search Keyword Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Catalog Cards
  const filteredCatalog = useMemo(() => {
    return sampleReportCatalogData.filter((card) => {
      if (selectedCategory !== "All" && card.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          card.title.toLowerCase().includes(q) ||
          card.code.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader =
      "InvoiceNo,InvoiceDate,PartyName,GSTIN,TaxableValueINR,CGST,SGST,IGST,TotalInvoiceINR\n";
    const csvRows = sampleGSTReportRows
      .map(
        (r) =>
          `"${r.invoiceNo}","${r.invoiceDate}","${r.partyName}","${r.gstin}","${r.taxableValue}","${r.cgst}","${r.sgst}","${r.igst}","${r.totalInvoiceValue}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WINHMS_Secondary_Report_${activeReport.code}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage(`Exported ${activeReport.title} to CSV.`);
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Reports"
      title="Reports2 - Advanced & Statutory Reports"
      description="Executive management accounting center, GST tax compliance, bank reconciliation statements, and audit verification reports."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Reports2" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setToastMessage(`Generated ${activeReport.title} for period ${dateFrom} to ${dateTo}.`)
            }
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <FileCheck2 className="h-3.5 w-3.5 mr-1" />
            Generate Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved report filter preset.")}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save Preset
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Report
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity & Period Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value="LUXY HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="LUXY HOTEL & RESORTS PRIVATE LIMITED">
                  LUXY HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
              </select>
            </div>

            <div className="w-36">
              <span className="font-bold text-xs text-slate-600 block">From Date:</span>
              <FODatePicker value={dateFrom} onChange={setDateFrom} placeholder="DD/MM/YYYY" />
            </div>

            <div className="w-36">
              <span className="font-bold text-xs text-slate-600 block">To Date:</span>
              <FODatePicker value={dateTo} onChange={setDateTo} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              GST Net Payable: ₹ 18,40,000.00
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Layers className="h-3.5 w-3.5 text-slate-600" />
              Active: {activeReport.code}
            </span>
          </div>
        </div>

        {/* Category Filter Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {[
            { id: "All", label: "All Specialized Reports", icon: Layers },
            { id: "GST", label: "GST Tax & Statutory Compliance", icon: Percent },
            { id: "BRS", label: "Bank Reconciliation (BRS)", icon: Landmark },
            { id: "Party", label: "Party Sub-Ledger & Outstanding", icon: Users },
            { id: "CostCenter", label: "Cost Center & Department", icon: Building2 },
            { id: "Audit", label: "Audit Trail & Edits Log", icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Overview Strip (4 Stat Mini-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatMiniCard
          label="Available Specialized Reports"
          value={`${sampleReportCatalogData.length} Reports`}
          icon={FileText}
        />
        <StatMiniCard
          label="GST Tax Payable (Net)"
          value="₹ 18,40,000.00"
          sublabel="GSTR-3B Net Liability"
          icon={Percent}
        />
        <StatMiniCard
          label="Pending Bank Uncleared"
          value="₹ 4,50,000.00"
          sublabel="Uncleared Cheques / UTR"
          icon={Landmark}
        />
        <StatMiniCard
          label="Audit Log Edits Tracked"
          value="14 Entries"
          sublabel="Backdated & Modified Vouchers"
          icon={ShieldCheck}
        />
      </div>

      {/* Report Catalog Selection Cards Grid */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Executive Reports Catalog ({filteredCatalog.length} Available)
          </h3>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search report by name or code..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCatalog.map((card) => {
            const isSelected = activeReport.id === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setActiveReport(card)}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden",
                  isSelected
                    ? "bg-emerald-50/90 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {card.code}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      card.category === "GST"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : card.category === "BRS"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                    )}
                  >
                    {card.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{card.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Updated: {card.lastGenerated}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    Select <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Report Live Data Preview Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="font-mono text-xs font-bold text-slate-500">{activeReport.code}</span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{activeReport.title}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                LIVE PREVIEW
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Selected
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-3 font-mono">GSTIN</th>
                <th className="py-3 px-3 text-right">Taxable Value (INR)</th>
                <th className="py-3 px-3 text-right">CGST (9%)</th>
                <th className="py-3 px-3 text-right">SGST (9%)</th>
                <th className="py-3 px-3 text-right">IGST (18%)</th>
                <th className="py-3 px-4 text-right">Total Invoice (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {sampleGSTReportRows.map((row) => (
                <tr key={row.invoiceNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{row.invoiceNo}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{row.invoiceDate}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{row.partyName}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{row.gstin}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(row.taxableValue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {row.cgst > 0 ? formatINR(row.cgst) : "-"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {row.sgst > 0 ? formatINR(row.sgst) : "-"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-purple-700 font-bold">
                    {row.igst > 0 ? formatINR(row.igst) : "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800">
                    {formatINR(row.totalInvoiceValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePageShell>
  );
}
