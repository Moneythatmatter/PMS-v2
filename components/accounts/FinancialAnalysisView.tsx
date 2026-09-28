"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  Calendar,
  CheckCircle2,
  Printer,
  Download,
  DollarSign,
  SlidersHorizontal,
  Scale,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField, TextInput, SelectInput, StatMiniCard } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accBudgetService, accReportService, type AnalysisReport, type Budget } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type Tab = "department" | "trend" | "ratios" | "aging" | "budget";

const TABS: { id: Tab; label: string; icon: typeof PieChart }[] = [
  { id: "department", label: "Departmental P&L Analysis", icon: PieChart },
  { id: "trend", label: "Monthly Trend Analysis", icon: TrendingUp },
  { id: "ratios", label: "Financial Ratios & KPIs", icon: Scale },
  { id: "aging", label: "Receivables & Debtors Aging", icon: Clock },
  { id: "budget", label: "Budget vs Actual Variance", icon: SlidersHorizontal },
];

const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(1)}%`);
const times = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(2)}x`);
const days = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(1)} days`);

function monthLabel(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00`);
  return Number.isNaN(d.getTime()) ? ym : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function ratioRows(r: AnalysisReport["ratios"]) {
  return [
    { name: "Gross Profit Margin", category: "Profitability", value: pct(r.grossMargin), note: "Gross profit (revenue less direct expenses) as % of total revenue." },
    { name: "Net Profit Margin", category: "Profitability", value: pct(r.netMargin), note: "Net profit after all expenses as % of total revenue." },
    { name: "Payroll Cost %", category: "Cost Control", value: pct(r.payrollPercent), note: "Salaries, wages & benefits as % of total revenue." },
    { name: "Cost of Sales %", category: "Cost Control", value: pct(r.costOfSalesPercent), note: "Food, beverage & other cost of sales as % of total revenue." },
    { name: "Current Ratio", category: "Liquidity", value: times(r.currentRatio), note: "Current assets ÷ current liabilities as on period end." },
    { name: "Quick Ratio", category: "Liquidity", value: times(r.quickRatio), note: "Current assets excluding stock ÷ current liabilities." },
    { name: "Debt to Equity", category: "Solvency", value: times(r.debtEquity), note: "Borrowings ÷ owners' equity as on period end." },
    { name: "Working Capital", category: "Liquidity", value: formatINR(r.workingCapital), note: "Current assets less current liabilities." },
    { name: "Receivable Days", category: "Efficiency", value: days(r.receivableDays), note: "Average days to collect outstanding receivables." },
    { name: "Payable Days", category: "Efficiency", value: days(r.payableDays), note: "Average days taken to pay outstanding payables." },
  ];
}

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type BudgetForm = { id: string | null; divisionId: string; budgetAmount: string; remarks: string };

export function FinancialAnalysisView() {
  const [activeTab, setActiveTab] = useState<Tab>("department");
  const { lookups } = useAccLookups();
  const [selectedFyId, setSelectedFyId] = useState("");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const { data: report, loading, error, reload } = useAccQuery(
    () => accReportService.analysis(selectedFyId ? { fiscalYearId: selectedFyId } : {}),
    [selectedFyId],
  );
  const reportFyId = report?.fiscalYearId ?? null;
  const budgetList = useAccQuery<Budget[]>(
    () => (reportFyId ? accBudgetService.list({ fiscalYearId: reportFyId }) : Promise.resolve([])),
    [reportFyId],
  );

  const [budgetForm, setBudgetForm] = useState<BudgetForm | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [savingBudget, setSavingBudget] = useState(false);

  const fiscalYears = lookups?.fiscalYears ?? [];
  const divisionCodes = useMemo(
    () => new Map((lookups?.divisions ?? []).map((d) => [d.id, d.divisionCode])),
    [lookups],
  );

  const totals = useMemo(() => {
    const depts = report?.departments ?? [];
    const totalRev = depts.reduce((s, d) => s + d.income, 0);
    const totalCost = depts.reduce((s, d) => s + d.expense, 0);
    const totalNet = totalRev - totalCost;
    return { totalRev, totalCost, totalNet, margin: totalRev > 0 ? (totalNet / totalRev) * 100 : 0 };
  }, [report]);

  const budgetTotals = useMemo(() => {
    const rows = report?.budgets ?? [];
    const budget = rows.reduce((s, b) => s + b.budget, 0);
    const actual = rows.reduce((s, b) => s + b.actual, 0);
    return { budget, actual, realization: budget > 0 ? (actual / budget) * 100 : null };
  }, [report]);

  const handleExportCSV = () => {
    if (!report) return;
    let header: string[] = [];
    let rows: (string | number | null)[][] = [];
    if (activeTab === "department") {
      header = ["Division Code", "Division", "Revenue", "Cost", "Net", "Margin %", "Share %", "Budget"];
      rows = report.departments.map((d) => [
        divisionCodes.get(d.divisionId ?? "") ?? "", d.divisionName, d.income, d.expense, d.net,
        d.income ? ((d.net / d.income) * 100).toFixed(1) : "", d.share, d.budget,
      ]);
    } else if (activeTab === "trend") {
      header = ["Period", "From", "To", "Income", "Expense", "Net"];
      rows = [
        ...report.quarterly.map((q) => [q.quarter, q.from, q.to, q.income, q.expense, q.net]),
        ...report.monthly.map((m) => [monthLabel(m.month), "", "", m.income, m.expense, m.net]),
      ];
    } else if (activeTab === "ratios") {
      header = ["Ratio", "Category", "Value", "Definition"];
      rows = ratioRows(report.ratios).map((r) => [r.name, r.category, r.value, r.note]);
    } else if (activeTab === "aging") {
      header = ["Party", ...report.receivablesAging.labels, "Total"];
      rows = [
        ...report.receivablesAging.topParties.map((p) => [p.partyName, ...p.buckets, p.total]),
        ["All Debtors", ...report.receivablesAging.totals.buckets, report.receivablesAging.totals.total],
      ];
    } else {
      header = ["Division Code", "Division", "Budget", "Actual Revenue", "Variance", "Utilization %"];
      rows = report.budgets.map((b) => [b.divisionCode, b.divisionName, b.budget, b.actual, b.variance, b.utilization]);
    }
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-analysis-${activeTab}-${(report.fiscalYearName ?? report.to).replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openBudgetForm = (budgetId?: string) => {
    const existing = budgetId ? budgetList.data?.find((b) => b.id === budgetId) : undefined;
    const fromReport = budgetId ? report?.budgets.find((b) => b.budgetId === budgetId) : undefined;
    setBudgetError(null);
    setBudgetForm({
      id: budgetId ?? null,
      divisionId: existing?.divisionId ?? fromReport?.divisionId ?? "",
      budgetAmount: String(existing?.budgetAmount ?? fromReport?.budget ?? ""),
      remarks: existing?.remarks ?? "",
    });
  };

  const saveBudget = async () => {
    if (!budgetForm || !reportFyId) return;
    if (!budgetForm.divisionId) {
      setBudgetError("Select a division.");
      return;
    }
    setSavingBudget(true);
    setBudgetError(null);
    try {
      const body: Partial<Budget> = {
        fiscalYearId: reportFyId,
        divisionId: budgetForm.divisionId,
        budgetAmount: Number(budgetForm.budgetAmount) || 0,
        remarks: budgetForm.remarks.trim(),
      };
      if (budgetForm.id) await accBudgetService.update(budgetForm.id, body);
      else await accBudgetService.create(body);
      setBudgetForm(null);
      setToast({ message: "Budget saved.", variant: "success" });
      await Promise.all([reload(), budgetList.reload()]);
    } catch (e) {
      setBudgetError(accErrorMessage(e));
    } finally {
      setSavingBudget(false);
    }
  };

  const deleteBudget = async (budgetId: string, label: string) => {
    if (!window.confirm(`Delete the budget for ${label}?`)) return;
    try {
      await accBudgetService.remove(budgetId);
      setToast({ message: `Budget for ${label} deleted.`, variant: "success" });
      await Promise.all([reload(), budgetList.reload()]);
    } catch (e) {
      setToast({ message: accErrorMessage(e), variant: "error" });
    }
  };

  const budgetedDivisionIds = new Set((report?.budgets ?? []).map((b) => b.divisionId));

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Financial Analysis"
      description="Executive financial analytics, departmental P&L variance, party aging distribution, ratio benchmarks, and trend forecasting."
      breadcrumbs={[{ label: "Accounts", href: "/accounts/dashboard" }, { label: "Analysis" }]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void reload()}
            disabled={loading}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 mr-1" />}
            Refresh Analytics
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
            disabled={!report}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Calendar className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="w-72">
              <span className="font-bold text-xs text-slate-600 block">Financial Year:</span>
              <select
                value={selectedFyId}
                onChange={(e) => setSelectedFyId(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Current financial year</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.fiscalYearName} ({fy.status})
                  </option>
                ))}
              </select>
            </div>
            {report && (
              <span className="text-[11px] font-semibold text-slate-500">
                {report.fiscalYearName ? `${report.fiscalYearName} · ` : ""}
                {formatDate(report.from)} to {formatDate(report.to)}
              </span>
            )}
          </div>

          {report && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
                <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
                Net Margin: {pct(report.summary.netMargin)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 border border-emerald-200 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                Revenue YTD: {formatINR(report.summary.totalRevenue)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                  isActive ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {!report ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500 shadow-xs">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              Computing financial analysis…
            </span>
          ) : (
            "No analysis available."
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatMiniCard
              label="Total Gross Revenue YTD"
              value={formatINR(report.summary.totalRevenue)}
              sublabel={`Expenses ${formatINR(report.summary.totalExpenses, { decimals: 0 })}`}
              icon={DollarSign}
            />
            <StatMiniCard
              label="Gross Profit"
              value={formatINR(report.summary.grossProfit)}
              sublabel={`Gross Margin: ${pct(report.summary.grossMargin)} · Net ${formatINR(report.summary.netProfit, { decimals: 0 })}`}
              icon={TrendingUp}
            />
            <StatMiniCard
              label="Debtors Receivables"
              value={formatINR(report.receivablesAging.totals.total)}
              sublabel={`Avg Collection: ${days(report.ratios.receivableDays)}`}
              icon={Clock}
            />
            <StatMiniCard
              label="Budget Realization Rate"
              value={budgetTotals.realization === null ? "—" : pct(budgetTotals.realization)}
              sublabel={
                budgetTotals.realization === null
                  ? "No budgets set for this year"
                  : `${formatINR(budgetTotals.actual, { decimals: 0 })} of ${formatINR(budgetTotals.budget, { decimals: 0 })}`
              }
              icon={BarChart3}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
            {activeTab === "department" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-emerald-600" />
                      Departmental Revenue, Cost & Net Contribution
                    </h3>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Division-wise income, expense and share of total revenue
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Total Net: {formatINR(totals.totalNet)}
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
                        <th className="py-3 px-3 text-right">Net Contribution</th>
                        <th className="py-3 px-3 text-center">Margin %</th>
                        <th className="py-3 px-3 text-center">Revenue Share</th>
                        <th className="py-3 px-3 text-center">Budget Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {report.departments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No division-wise revenue posted in this period.
                          </td>
                        </tr>
                      ) : (
                        report.departments.map((dept) => {
                          const margin = dept.income > 0 ? (dept.net / dept.income) * 100 : null;
                          const code = divisionCodes.get(dept.divisionId ?? "");
                          return (
                            <tr key={dept.divisionId ?? dept.divisionName} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">{code ?? "—"}</span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">{dept.divisionName}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                {dept.income > 0 ? formatINR(dept.income) : "-"}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600">{formatINR(dept.expense)}</td>
                              <td className={cn("py-3 px-3 text-right font-mono font-bold", dept.net >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                {formatINR(dept.net)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold">{pct(margin)}</td>
                              <td className="py-3 px-3 text-center font-mono">{pct(dept.share)}</td>
                              <td className="py-3 px-3 text-center">
                                {dept.budget === null ? (
                                  <span className="text-[10px] text-slate-400">No budget</span>
                                ) : (
                                  <span
                                    className={cn(
                                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                                      dept.income >= dept.budget
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-blue-50 text-blue-800 border-blue-200",
                                    )}
                                  >
                                    {dept.income >= dept.budget ? "Target Exceeded" : "Below Target"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {report.departments.length > 0 && (
                        <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                          <td colSpan={2} className="py-3 px-4 font-extrabold uppercase">
                            Total Hotel Operations
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{formatINR(totals.totalRev)}</td>
                          <td className="py-3 px-3 text-right font-mono">{formatINR(totals.totalCost)}</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-800">{formatINR(totals.totalNet)}</td>
                          <td className="py-3 px-3 text-center font-mono">{pct(totals.margin)}</td>
                          <td className="py-3 px-3 text-center font-mono">100%</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "trend" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Quarterly Financial Trend Overview{report.fiscalYearName ? ` (${report.fiscalYearName})` : ""}
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-500">{report.quarterly.length} Quarters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {report.quarterly.map((item) => (
                    <div key={item.quarter} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="font-bold text-xs text-slate-900 block border-b border-slate-200 pb-1">
                        {item.quarter} ({formatDate(item.from)} – {formatDate(item.to)})
                      </span>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Revenue:</span>
                          <strong className="text-slate-900">{formatINR(item.income)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expenses:</span>
                          <strong className="text-slate-600">{formatINR(item.expense)}</strong>
                        </div>
                        <div
                          className={cn(
                            "flex justify-between border-t border-slate-200 pt-1 font-extrabold",
                            item.net >= 0 ? "text-emerald-800" : "text-rose-700",
                          )}
                        >
                          <span>Net:</span>
                          <span>{formatINR(item.net)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <th className="py-2.5 px-4">Month</th>
                        <th className="py-2.5 px-3 text-right">Revenue</th>
                        <th className="py-2.5 px-3 text-right">Expenses</th>
                        <th className="py-2.5 px-3 text-right">Net</th>
                        <th className="py-2.5 px-3 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {report.monthly.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No postings in this period.
                          </td>
                        </tr>
                      ) : (
                        report.monthly.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-bold">{monthLabel(m.month)}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(m.income)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatINR(m.expense)}</td>
                            <td className={cn("py-2.5 px-3 text-right font-mono font-bold", m.net >= 0 ? "text-emerald-700" : "text-rose-700")}>
                              {formatINR(m.net)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{pct(m.income ? (m.net / m.income) * 100 : null)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "ratios" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    Hotel Accounting Financial Ratios
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">As on {formatDate(report.to)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Financial Ratio & Indicator</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 font-mono">Actual Value</th>
                        <th className="py-3 px-4">Definition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {ratioRows(report.ratios).map((ratio) => (
                        <tr key={ratio.name} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{ratio.name}</td>
                          <td className="py-3 px-3 font-semibold text-slate-600">{ratio.category}</td>
                          <td className="py-3 px-3 font-mono font-extrabold text-emerald-800">{ratio.value}</td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{ratio.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "aging" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    Party Debtors Aging Distribution
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    As on {formatDate(report.to)} · Payables outstanding {formatINR(report.payablesOutstanding)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Party</th>
                        {report.receivablesAging.labels.map((l) => (
                          <th key={l} className="py-3 px-3 text-right">
                            {l}
                          </th>
                        ))}
                        <th className="py-3 px-4 text-right">Total Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {report.receivablesAging.topParties.length === 0 ? (
                        <tr>
                          <td colSpan={report.receivablesAging.labels.length + 2} className="py-8 text-center text-slate-400">
                            No outstanding receivables.
                          </td>
                        </tr>
                      ) : (
                        report.receivablesAging.topParties.map((p) => (
                          <tr key={p.partyId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {p.partyName}
                              <span className="block text-[10px] font-medium text-slate-500">
                                {p.partyGroup}
                                {p.overLimit ? " · Over credit limit" : ""}
                              </span>
                            </td>
                            {p.buckets.map((v, i) => (
                              <td
                                key={i}
                                className={cn(
                                  "py-3 px-3 text-right font-mono",
                                  i === 0 ? "text-emerald-800 font-bold" : i === p.buckets.length - 1 ? "text-rose-700 font-bold" : "text-slate-700",
                                )}
                              >
                                {v ? formatINR(v) : "-"}
                              </td>
                            ))}
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatINR(p.total)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td className="py-3 px-4 font-extrabold uppercase">All Debtors</td>
                        {report.receivablesAging.totals.buckets.map((v, i) => (
                          <td key={i} className="py-3 px-3 text-right font-mono">
                            {formatINR(v)}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right font-mono">{formatINR(report.receivablesAging.totals.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500">Top 10 debtors by outstanding are listed; totals include all debtors.</p>
              </div>
            )}

            {activeTab === "budget" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                    Departmental Revenue Budget vs Actual Variance
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!reportFyId}
                    onClick={() => openBudgetForm()}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Budget
                  </Button>
                </div>

                {!reportFyId && (
                  <p className="text-[11px] text-amber-700">No fiscal year found for this period — budgets cannot be set.</p>
                )}

                {report.budgets.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">No division budgets set for this financial year.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {report.budgets.map((item) => {
                      const favorable = item.variance >= 0;
                      const label = item.divisionName ?? item.divisionCode ?? "Division";
                      return (
                        <div key={item.budgetId} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-xs text-slate-900">{label}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border",
                                  favorable ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200",
                                )}
                              >
                                {favorable ? "Favorable" : "Unfavorable"}
                              </span>
                              <button
                                type="button"
                                onClick={() => openBudgetForm(item.budgetId)}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-emerald-700"
                                title="Edit budget"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteBudget(item.budgetId, label)}
                                className="p-1 rounded hover:bg-rose-100 text-slate-500 hover:text-rose-700"
                                title="Delete budget"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 font-mono text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Budget:</span>
                              <strong>{formatINR(item.budget)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Actual:</span>
                              <strong>{formatINR(item.actual)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Utilization:</span>
                              <strong>{pct(item.utilization)}</strong>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                              <span className="text-slate-600">Variance:</span>
                              <span className={favorable ? "text-emerald-700" : "text-rose-700"}>
                                {favorable ? "+ " : "- "}
                                {formatINR(Math.abs(item.variance))} {favorable ? "Ahead" : "Short"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {budgetForm && (
        <Modal
          isOpen
          onClose={() => setBudgetForm(null)}
          title={budgetForm.id ? "Edit Division Budget" : "Add Division Budget"}
          description={report?.fiscalYearName ?? undefined}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <FormField label="Division" required>
              <SelectInput
                value={budgetForm.divisionId}
                disabled={!!budgetForm.id}
                onChange={(e) => setBudgetForm({ ...budgetForm, divisionId: e.target.value })}
              >
                <option value="">— Select division —</option>
                {(lookups?.divisions ?? [])
                  .filter((d) => d.id === budgetForm.divisionId || !budgetedDivisionIds.has(d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.divisionCode} · {d.divisionName}
                    </option>
                  ))}
              </SelectInput>
            </FormField>
            <FormField label="Revenue Budget (₹)" required>
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={budgetForm.budgetAmount}
                onChange={(e) => setBudgetForm({ ...budgetForm, budgetAmount: e.target.value })}
              />
            </FormField>
            <FormField label="Remarks">
              <TextInput value={budgetForm.remarks} onChange={(e) => setBudgetForm({ ...budgetForm, remarks: e.target.value })} />
            </FormField>
            {budgetError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-800">{budgetError}</div>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setBudgetForm(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingBudget}
                onClick={() => void saveBudget()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {savingBudget && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Save Budget
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
