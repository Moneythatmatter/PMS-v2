"use client";

import Link from "next/link";
import {
  TrendingUp,
  Users,
  Wallet,
  Scale,
  Receipt,
  BookOpen,
  FileText,
  Layers,
  Bell,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { StatMiniCard } from "@/components/frontoffice/ui";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { DeskActivityFeed } from "@/components/frontoffice/DeskActivityFeed";
import { DepartmentRevenueChart } from "@/components/charts/DepartmentRevenueChart";
import { BookingPlatformRevenueChart } from "@/components/charts/BookingPlatformRevenueChart";
import { UpcomingVendorPayments } from "@/components/accounts/UpcomingVendorPayments";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    label: "GL Transaction",
    href: "/accounts/transactions/gl-transaction",
    icon: Receipt,
    hint: "Post vouchers",
  },
  {
    label: "Receipt & Payment",
    href: "/accounts/transactions/gl-receipts-payments",
    icon: Wallet,
    hint: "Cash / Bank",
  },
  {
    label: "Trial Balance",
    href: "/accounts/reports/trial-balance",
    icon: Scale,
    hint: "Balances summary",
  },
  {
    label: "Profit & Loss",
    href: "/accounts/reports/profit-and-loss",
    icon: TrendingUp,
    hint: "Income & Expense",
  },
  {
    label: "Balance Sheet",
    href: "/accounts/reports/balance-sheet",
    icon: FileText,
    hint: "Assets & Liabilities",
  },
  {
    label: "General Ledger",
    href: "/accounts/reports/general-ledger",
    icon: BookOpen,
    hint: "Account details",
  },
  {
    label: "Party Outstanding",
    href: "/accounts/party-outstanding/bills-aging",
    icon: Users,
    hint: "Bills aging",
  },
  {
    label: "Chart of Accounts",
    href: "/accounts/masters/chart-of-accounts",
    icon: Layers,
    hint: "Account masters",
  },
];

const alerts = [
  {
    id: "bank-recon",
    tone: "warning" as const,
    title: "3 Bank Reconciliations Pending",
    detail: "HDFC Bank · 3 unverified entries awaiting match",
    href: "/accounts/transactions/bank-reconciliation",
    action: "Reconcile now",
  },
  {
    id: "prov-vouchers",
    tone: "danger" as const,
    title: "5 Provisional Vouchers Awaiting Approval",
    detail: "Review and approve before month-end posting",
    href: "/accounts/transactions/provisional-transactions",
    action: "Review vouchers",
  },
  {
    id: "month-close",
    tone: "info" as const,
    title: "Fiscal Period Closing Reminder",
    detail: "Period Jun 2026 closing due in 4 days",
    href: "/accounts/transactions/fiscal-period-closing",
    action: "Period status",
  },
  {
    id: "party-overdue",
    tone: "warning" as const,
    title: "2 Party Overdue Invoices (>30 Days)",
    detail: "Global Travel Corp · 8,400 overdue",
    href: "/accounts/party-outstanding/bills-aging",
    action: "View aging",
  },
];

const recentTransactions = [
  {
    id: "VCH-2026-104",
    type: "General Journal",
    account: "Room Sales Income",
    amount: "12,500.00",
    status: "Posted",
    statusTone: "emerald",
  },
  {
    id: "VCH-2026-103",
    type: "Receipt Voucher",
    account: "Grand Event Corp",
    amount: "8,400.00",
    status: "Approved",
    statusTone: "emerald",
  },
  {
    id: "VCH-2026-102",
    type: "Payment Voucher",
    account: "City Utilities Ltd",
    amount: "3,250.00",
    status: "Posted",
    statusTone: "emerald",
  },
  {
    id: "VCH-2026-101",
    type: "Provisional Journal",
    account: "Inventory Stock Adjustment",
    amount: "1,800.00",
    status: "Provisional",
    statusTone: "amber",
  },
  {
    id: "VCH-2026-100",
    type: "Receipt Voucher",
    account: "Express Booking Services",
    amount: "5,600.00",
    status: "Posted",
    statusTone: "emerald",
  },
];

const partyOutstanding = [
  {
    name: "Grand Event Corp",
    category: "Debtor (AR)",
    dueDate: "28 Jun 2026",
    amount: "8,400.00",
    status: "Pending",
    statusTone: "amber",
  },
  {
    name: "Prime Supplies Ltd",
    category: "Creditor (AP)",
    dueDate: "25 Jun 2026",
    amount: "6,200.00",
    status: "Overdue",
    statusTone: "red",
  },
  {
    name: "Skyline Travel Bureau",
    category: "Debtor (AR)",
    dueDate: "30 Jun 2026",
    amount: "4,850.00",
    status: "Pending",
    statusTone: "amber",
  },
  {
    name: "Fresh Produce Wholesalers",
    category: "Creditor (AP)",
    dueDate: "22 Jun 2026",
    amount: "3,900.00",
    status: "Overdue",
    statusTone: "red",
  },
  {
    name: "Metropolis Catering",
    category: "Debtor (AR)",
    dueDate: "02 Jul 2026",
    amount: "2,750.00",
    status: "Settled",
    statusTone: "emerald",
  },
];

const treasuryAccounts = [
  { label: "HDFC Operational Bank", amount: "48,000.00", percent: 56, color: "#15803d" },
  { label: "ICICI Merchant Bank", amount: "24,500.00", percent: 29, color: "#0284c7" },
  { label: "Cash in Hand", amount: "9,400.00", percent: 11, color: "#d97706" },
  { label: "Petty Cash Float", amount: "3,500.00", percent: 4, color: "#64748b" },
];

const expenseBudgets = [
  { label: "Food & Beverages", count: 32400, max: 50000, color: "#15803d" },
  { label: "Staff Payroll & Benefits", count: 28100, max: 45000, color: "#0284c7" },
  { label: "Utilities & Energy", count: 14200, max: 20000, color: "#d97706" },
  { label: "Repairs & Maintenance", count: 8500, max: 15000, color: "#64748b" },
];

const activityLogs = [
  { id: "1", message: "Voucher #VCH-2026-104 posted for 12,500 by Admin", timestamp: "10 mins ago" },
  { id: "2", message: "Bank reconciliation matched 14 entries for HDFC Bank", timestamp: "35 mins ago" },
  { id: "3", message: "Payment advice #PA-104 generated for Prime Supplies Ltd", timestamp: "1 hr ago" },
  { id: "4", message: "Provisional voucher #VCH-2026-101 submitted for approval", timestamp: "2 hrs ago" },
  { id: "5", message: "Party master updated for Grand Event Corp", timestamp: "4 hrs ago" },
];

export function AccountsDashboardView() {
  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Dashboard"
      description="Real-time financial overview, departmental revenue analytics, booking channel mix, vendor payments schedule, and ledger summaries."
      wrapChildren={false}
    >
      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Total Revenue"
          value="₹148,250.00"
          accent="#15803d"
          icon={TrendingUp}
          sublabel="+12.4% vs last month"
        />
        <StatMiniCard
          label="Accounts Receivable"
          value="₹34,120.00"
          accent="#d97706"
          icon={Users}
          sublabel="18 receivables pending"
        />
        <StatMiniCard
          label="Accounts Payable"
          value="₹25,500.00"
          accent="#0284c7"
          icon={Wallet}
          sublabel="5 vendor payables due"
        />
        <StatMiniCard
          label="Net Margin (P&L)"
          value="₹42,600.00"
          accent="#059669"
          icon={Scale}
          sublabel="28.7% net margin"
        />
      </div>

      {/* Needs Attention Section */}
      {alerts.length > 0 && (
        <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {alerts.length}
              </span>
            </div>
            <Link
              href="/accounts/transactions/provisional-transactions"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Provisional approvals
            </Link>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  "rounded-lg border px-2.5 py-2 transition hover:shadow-sm",
                  alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                  alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                  alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                )}
              >
                <p className="text-xs font-semibold leading-snug">{alert.title}</p>
                <p className="mt-0.5 truncate text-[11px] opacity-80">{alert.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions Shortcuts */}
      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <p className="text-[11px] text-slate-500">Accounts shortcuts</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 transition hover:border-emerald-300 hover:bg-emerald-50/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 ring-1 ring-slate-200">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{link.label}</p>
                  <p className="truncate text-[10px] text-slate-500">{link.hint}</p>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Revenue Analytics Row: Departmental Revenue & Booking Platform Revenue Graphs */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DepartmentRevenueChart
          title="Departmental Revenue Distribution"
          subtitle="Revenue contributed by operational module"
        />
        <BookingPlatformRevenueChart
          title="Booking Platform Revenue"
          subtitle="Revenue contribution by reservation channel"
        />
      </div>

      {/* Vendor Payments & GL Vouchers Section */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Upcoming Vendor Payments */}
        <UpcomingVendorPayments />

        {/* Recent GL Transactions */}
        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent GL Vouchers</h2>
              <p className="text-[11px] text-slate-500">{recentTransactions.length} latest entries</p>
            </div>
            <Link href="/accounts/transactions/gl-transaction">
              <Button type="button" size="sm" variant="outline">
                View all
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {recentTransactions.map((trx) => (
              <li
                key={trx.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {trx.id} <span className="font-normal text-slate-500">· {trx.type}</span>
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{trx.account}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-900">₹{trx.amount}</span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                      trx.statusTone === "emerald" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                      trx.statusTone === "amber" && "bg-amber-50 text-amber-700 ring-amber-200",
                      trx.statusTone === "red" && "bg-red-50 text-red-700 ring-red-200",
                    )}
                  >
                    {trx.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Bottom 3 Cards Grid */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {/* Top Party Outstanding */}
        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Party Outstanding</h2>
              <p className="text-[11px] text-slate-500">Top aging balances</p>
            </div>
            <Link href="/accounts/party-outstanding/bills-aging">
              <Button type="button" size="sm" variant="outline">
                Aging Report
              </Button>
            </Link>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-slate-100">
            {partyOutstanding.map((party) => (
              <li
                key={party.name}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{party.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {party.category} · Due: {party.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-900">₹{party.amount}</span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                      party.statusTone === "emerald" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                      party.statusTone === "amber" && "bg-amber-50 text-amber-700 ring-amber-200",
                      party.statusTone === "red" && "bg-red-50 text-red-700 ring-red-200",
                    )}
                  >
                    {party.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Cash & Bank Balances */}
        <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Treasury & Bank Balances</h2>
              <p className="text-[11px] text-slate-500">Liquid assets</p>
            </div>
            <Link href="/accounts/masters/currency" className="text-xs font-medium text-emerald-700 hover:underline">
              Details
            </Link>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="3"
                  strokeDasharray="85 15"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-900">85k</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">₹85,400.00</p>
              <p className="text-[11px] text-slate-500">Total liquid balance</p>
            </div>
          </div>
          <div className="mt-auto space-y-2">
            {treasuryAccounts.map((acc) => (
              <div key={acc.label}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{acc.label}</span>
                  <span className="font-semibold text-slate-900">₹{acc.amount}</span>
                </div>
                <ProgressBar value={acc.percent} max={100} color={acc.color} />
              </div>
            ))}
          </div>
        </section>

        {/* Accounts Activity Feed */}
        <DeskActivityFeed activities={activityLogs} />
      </div>
    </ModulePageShell>
  );
}
