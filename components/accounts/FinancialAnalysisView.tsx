"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  Building2,
  CheckCircle2,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  ShieldCheck,
  CheckSquare,
  FileText,
  Eye,
  Calendar,
  Users,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  Percent,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleDepartmentPerformanceData,
  sampleFinancialRatiosData,
  sampleAgingBucketsData,
} from "@/app/data/accounts/analysisData";
import { cn } from "@/lib/utils";

export function FinancialAnalysisView() {
  // Tab State ('department' | 'trend' | 'ratios' | 'aging' | 'budget')
  const [activeTab, setActiveTab] = useState<
    "department" | "trend" | "ratios" | "aging" | "budget"
  >("department");

  // Selected Financial Year State
  const [selectedFY, setSelectedFY] = useState("2026-2027");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Totals Calculation
  const totals = useMemo(() => {
    const totalRev = sampleDepartmentPerformanceData.reduce(
      (sum, d) => sum + d.revenueYTD,
      0
    );
    const totalCost = sampleDepartmentPerformanceData.reduce(
      (sum, d) => sum + d.costYTD,
      0
    );
    const totalGOP = totalRev - totalCost;
    const overallGOPMargin = totalRev > 0 ? (totalGOP / totalRev) * 100 : 0;

    return { totalRev, totalCost, totalGOP, overallGOPMargin };
  }, []);

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader = "DepartmentCode,DepartmentName,RevenueYTD,CostYTD,GOPAmount,GOPMarginPct,Status\n";
    const csvRows = sampleDepartmentPerformanceData
      .map(
        (d) =>
          `"${d.departmentCode}","${d.departmentName}","${d.revenueYTD}","${d.costYTD}","${d.gopAmount}","${d.gopMarginPct}%","${d.status}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WINHMS_Financial_Analysis_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Financial Analysis report to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Financial Analysis"
      description="Executive financial analytics, departmental P&L variance, party aging distribution, ratio benchmarks, and trend forecasting."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Analysis" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setToastMessage("Refreshed financial analytics metrics.")}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Refresh Analytics
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved custom analysis view configuration.")}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save View
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity & FY Selector Bar */}
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

            <div className="w-48">
              <span className="font-bold text-xs text-slate-600 block">Financial Year:</span>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="2026-2027">YEAR 2026 - 2027</option>
                <option value="2025-2026">YEAR 2025 - 2026</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
              GOP Margin: {totals.overallGOPMargin.toFixed(1)}%
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Revenue YTD: {formatINR(totals.totalRev)}
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {[
            { id: "department", label: "Departmental P&L Analysis", icon: PieChart },
            { id: "trend", label: "Monthly Trend Analysis", icon: TrendingUp },
            { id: "ratios", label: "Financial Ratios & KPIs", icon: Scale },
            { id: "aging", label: "Receivables & Debtors Aging", icon: Clock },
            { id: "budget", label: "Budget vs Actual Variance", icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Overview Strip (4 Stat Mini-Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatMiniCard
          label="Total Gross Revenue YTD"
          value={formatINR(totals.totalRev)}
          icon={DollarSign}
        />
        <StatMiniCard
          label="Gross Operating Profit (GOP)"
          value={formatINR(totals.totalGOP)}
          sublabel={`GOP Margin: ${totals.overallGOPMargin.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatMiniCard
          label="City Ledger Receivables"
          value="₹ 42,50,000.00"
          sublabel="Avg Collection: 28.5 Days"
          icon={Clock}
        />
        <StatMiniCard
          label="Budget Realization Rate"
          value="104.2 %"
          sublabel="Exceeds Annual Target"
          icon={BarChart3}
        />
      </div>

      {/* Tab Content Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
        {/* 📊 TAB 1: DEPARTMENTAL P&L ANALYSIS */}
        {activeTab === "department" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-emerald-600" />
                  USALI Departmental Revenue, Cost & GOP Breakdown
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Departmental operating margins and GOP contribution share
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Total GOP: {formatINR(totals.totalGOP)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">Dept Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-3 text-right">Revenue YTD (INR)</th>
                    <th className="py-3 px-3 text-right">Operating Cost (INR)</th>
                    <th className="py-3 px-3 text-right">Dept GOP Amount</th>
                    <th className="py-3 px-3 text-center">GOP Margin %</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {sampleDepartmentPerformanceData.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                          {dept.departmentCode}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{dept.departmentName}</td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {dept.revenueYTD > 0 ? formatINR(dept.revenueYTD) : "-"}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatINR(dept.costYTD)}
                      </td>

                      <td
                        className={cn(
                          "py-3 px-3 text-right font-mono font-bold",
                          dept.gopAmount >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}
                      >
                        {formatINR(dept.gopAmount)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {dept.gopMarginPct > 0 ? `${dept.gopMarginPct.toFixed(1)}%` : "Overhead"}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            dept.status === "Target Exceeded"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          )}
                        >
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={2} className="py-3 px-4 font-extrabold uppercase">
                      Total Hotel Operations
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(totals.totalRev)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(totals.totalCost)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">
                      {formatINR(totals.totalGOP)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{totals.overallGOPMargin.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-700 text-white rounded-full text-[10px] font-extrabold">
                        EXCELLENT
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📈 TAB 2: MONTHLY TREND ANALYSIS */}
        {activeTab === "trend" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Quarterly Financial Trend Overview (FY 2026-2027)
              </h3>
              <span className="font-mono text-xs font-bold text-slate-500">4 Quarters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { q: "Q1 (Apr - Jun 2026)", rev: 62000000.0, cost: 26000000.0, gop: 36000000.0, margin: "58.1%" },
                { q: "Q2 (Jul - Sep 2026)", rev: 68000000.0, cost: 28000000.0, gop: 40000000.0, margin: "58.8%" },
                { q: "Q3 (Oct - Dec 2026)", rev: 72000000.0, cost: 29000000.0, gop: 43000000.0, margin: "59.7%" },
                { q: "Q4 (Jan - Mar 2027)", rev: 50000000.0, cost: 22000000.0, gop: 28000000.0, margin: "56.0%" },
              ].map((item) => (
                <div key={item.q} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-900 block border-b border-slate-200 pb-1">
                    {item.q}
                  </span>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue:</span>
                      <strong className="text-slate-900">{formatINR(item.rev)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expenses:</span>
                      <strong className="text-slate-600">{formatINR(item.cost)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-800 font-extrabold">
                      <span>GOP:</span>
                      <span>{formatINR(item.gop)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⚖️ TAB 3: FINANCIAL RATIOS & KPIS */}
        {activeTab === "ratios" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-600" />
                Hotel Accounting Financial Ratios & Benchmark Comparison
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Financial Ratio & Indicator</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 font-mono">Actual Value</th>
                    <th className="py-3 px-3 font-mono">Industry Benchmark</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Executive Summary Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {sampleFinancialRatiosData.map((ratio) => (
                    <tr key={ratio.ratioName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{ratio.ratioName}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{ratio.category}</td>
                      <td className="py-3 px-3 font-mono font-extrabold text-emerald-800">
                        {ratio.actualValue}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{ratio.benchmarkValue}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                            ratio.status === "Excellent"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          )}
                        >
                          {ratio.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{ratio.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ⏳ TAB 4: RECEIVABLES & DEBTORS AGING */}
        {activeTab === "aging" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                City Ledger Party Debtors Aging Distribution
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Party Category</th>
                    <th className="py-3 px-3 text-right">Current (0-30 Days)</th>
                    <th className="py-3 px-3 text-right">31 - 60 Days</th>
                    <th className="py-3 px-3 text-right">61 - 90 Days</th>
                    <th className="py-3 px-3 text-right">90+ Days Overdue</th>
                    <th className="py-3 px-4 text-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {sampleAgingBucketsData.map((bucket) => (
                    <tr key={bucket.partyType} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{bucket.partyType}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 font-bold">
                        {formatINR(bucket.current0to30)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatINR(bucket.days31to60)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {formatINR(bucket.days61to90)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-700 font-bold">
                        {bucket.daysAbove90 > 0 ? formatINR(bucket.daysAbove90) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatINR(bucket.totalOutstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🎯 TAB 5: BUDGET VS ACTUAL VARIANCE */}
        {activeTab === "budget" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                Departmental Budget Targets vs Actual Expenditure Variance
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { dept: "Rooms Division", budget: "₹ 4,20,00,000", actual: "₹ 4,12,00,000", var: "+ ₹ 8,00,000 Saved", status: "Favorable" },
                { dept: "Food & Beverage", budget: "₹ 5,50,00,000", actual: "₹ 5,45,00,000", var: "+ ₹ 5,00,000 Saved", status: "Favorable" },
                { dept: "A&G Overhead", budget: "₹ 2,80,00,000", actual: "₹ 2,82,00,000", var: "- ₹ 2,00,000 Exceeded", status: "Unfavorable" },
              ].map((item) => (
                <div key={item.dept} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-bold text-xs text-slate-900">{item.dept}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border",
                        item.status === "Favorable"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget:</span>
                      <strong>{item.budget}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actual:</span>
                      <strong>{item.actual}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                      <span className="text-slate-600">Variance:</span>
                      <span className={item.status === "Favorable" ? "text-emerald-700" : "text-rose-700"}>
                        {item.var}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}
