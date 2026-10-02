"use client";

import { useMemo, useState } from "react";
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
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DepartmentRevenueChart } from "@/components/charts/DepartmentRevenueChart";
import { BookingPlatformRevenueChart } from "@/components/charts/BookingPlatformRevenueChart";
import { UpcomingVendorPayments } from "@/components/accounts/UpcomingVendorPayments";
import { VoucherEditModal } from "@/components/accounts/VoucherEditModal";
import { formatDate, formatINR, useAccQuery } from "@/components/accounts/accountsApi";
import {
  accAccountService,
  accAuditLogService,
  accPartyBillService,
  accReportService,
  type AccountTreeNode,
  type AuditLog,
} from "@/services/accounts";
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

const CHART_COLORS = ["#15803d", "#0284c7", "#8b5cf6", "#d97706", "#06b6d4", "#ec4899", "#64748b"];

const ENTITY_LABELS: Record<string, string> = {
  voucher: "Voucher",
  party_bill: "Party bill",
  covering_letter: "Covering letter",
  fiscal_period: "Fiscal period",
  fiscal_year: "Fiscal year",
  bank_reconciliation: "Bank reconciliation",
  closing_stock: "Closing stock",
};

type Tone = "emerald" | "amber" | "red";

function voucherTone(status: string): Tone {
  if (status === "Posted" || status === "Converted") return "emerald";
  if (status === "Reversed") return "red";
  return "amber";
}

function flattenTree(nodes: AccountTreeNode[]): AccountTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

function compactAmount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

function activityMessage(log: AuditLog): string {
  const d = log.details ?? {};
  const ref = [d.voucherNo, d.billNo, d.letterNo].find((v) => typeof v === "string" && v) as string | undefined;
  const label = ENTITY_LABELS[log.entityType] ?? log.entityType.replace(/_/g, " ");
  const parts = [`${label}${ref ? ` ${ref}` : ""}`, log.action.toLowerCase()];
  if (log.actor) parts.push(`by ${log.actor}`);
  let msg = parts.join(" ");
  if (log.reason) msg += ` · ${log.reason}`;
  return msg;
}

async function loadDashboard() {
  const [dashboard, activity, tree, openBills] = await Promise.all([
    accReportService.dashboard(),
    accAuditLogService.list({ limit: 10 }),
    accAccountService.tree(),
    accPartyBillService.list({ pendingOnly: true, status: "Open" }),
  ]);
  return { dashboard, activity, tree, openBills };
}

export function AccountsDashboardView() {
  const { data, loading, error, reload } = useAccQuery(loadDashboard, []);
  const [editVoucherId, setEditVoucherId] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!data) return null;
    const { dashboard, activity, tree, openBills } = data;
    const k = dashboard.kpis;

    const summaryStats = [
      {
        label: "Revenue (MTD)",
        value: formatINR(k.revenueMtd),
        accent: "#15803d",
        icon: TrendingUp,
        sublabel: `YTD ${formatINR(k.revenueYtd, { decimals: 0 })}`,
      },
      {
        label: "Accounts Receivable",
        value: formatINR(k.receivables),
        accent: "#d97706",
        icon: Users,
        sublabel: `${formatINR(k.overdueReceivables, { decimals: 0 })} overdue`,
      },
      {
        label: "Accounts Payable",
        value: formatINR(k.payables),
        accent: "#0284c7",
        icon: Wallet,
        sublabel: `${dashboard.upcomingVendorPayments.length} vendor bill${dashboard.upcomingVendorPayments.length === 1 ? "" : "s"} due in 30 days`,
      },
      {
        label: "Net Profit (YTD)",
        value: formatINR(k.netProfitYtd),
        accent: "#059669",
        icon: Scale,
        sublabel: `${k.netMarginYtd.toFixed(1)}% net margin`,
      },
    ];

    const overdueParties = openBills.filter((b) => b.moduleType === "AR" && b.overdueDays > 30);
    const alerts = [
      k.unreconciledBankEntries > 0 && {
        id: "bank-recon",
        tone: "warning" as const,
        title: `${k.unreconciledBankEntries} Unreconciled Bank ${k.unreconciledBankEntries === 1 ? "Entry" : "Entries"}`,
        detail: `Bank balance ${formatINR(k.bankBalance)} awaiting statement match`,
        href: "/accounts/transactions/bank-reconciliation",
      },
      k.provisionalEntries > 0 && {
        id: "prov-vouchers",
        tone: "danger" as const,
        title: `${k.provisionalEntries} Provisional ${k.provisionalEntries === 1 ? "Entry" : "Entries"} Pending`,
        detail: "Convert or reverse before period closing",
        href: "/accounts/transactions/provisional-transactions",
      },
      k.draftVouchers > 0 && {
        id: "draft-vouchers",
        tone: "info" as const,
        title: `${k.draftVouchers} Draft Voucher${k.draftVouchers === 1 ? "" : "s"} Not Posted`,
        detail: "Drafts block fiscal period closing",
        href: "/accounts/transactions/gl-transaction",
      },
      overdueParties.length > 0 && {
        id: "party-overdue",
        tone: "warning" as const,
        title: `${overdueParties.length} Party Overdue Invoice${overdueParties.length === 1 ? "" : "s"} (>30 Days)`,
        detail: `${formatINR(overdueParties.reduce((s, b) => s + b.balance, 0))} overdue`,
        href: "/accounts/party-outstanding/bills-aging",
      },
    ].filter(Boolean) as {
      id: string;
      tone: "warning" | "danger" | "info";
      title: string;
      detail: string;
      href: string;
    }[];

    const deptTotal = dashboard.departmentRevenue.reduce((s, d) => s + d.value, 0);
    const departmentData = dashboard.departmentRevenue.map((d, i) => ({
      module: d.name,
      revenue: d.value,
      share: deptTotal ? Math.round((d.value / deptTotal) * 1000) / 10 : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    const channelTotal = dashboard.channelRevenue.reduce((s, d) => s + d.value, 0);
    const channelData = dashboard.channelRevenue.map((d, i) => ({
      platform: d.name,
      revenue: d.value,
      percentage: channelTotal ? Math.round((d.value / channelTotal) * 100) : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const partyOutstanding = [...openBills]
      .sort((a, b) => b.overdueDays - a.overdueDays || b.balance - a.balance)
      .slice(0, 5);

    const liquidTotal = k.cashBalance + k.bankBalance;
    const treasuryAccounts = flattenTree(tree)
      .filter((n) => n.accountType === "Ledger" && (n.isBankAccount || n.isCashAccount) && n.net !== 0)
      .sort((a, b) => b.net - a.net)
      .map((n, i) => ({
        id: n.id,
        label: n.name,
        amount: n.net,
        percent: liquidTotal > 0 ? Math.max(0, Math.round((n.net / liquidTotal) * 100)) : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
    const bankShare = liquidTotal > 0 ? Math.max(0, Math.min(100, Math.round((k.bankBalance / liquidTotal) * 100))) : 0;

    return {
      dashboard,
      activity,
      summaryStats,
      alerts,
      departmentData,
      channelData,
      partyOutstanding,
      liquidTotal,
      treasuryAccounts,
      bankShare,
    };
  }, [data]);

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Dashboard"
      description={
        view
          ? `Real-time financial overview as on ${formatDate(view.dashboard.asOn)}${view.dashboard.fiscalYearName ? ` · FY ${view.dashboard.fiscalYearName}` : ""}.`
          : "Real-time financial overview, departmental revenue analytics, booking channel mix, vendor payments schedule, and ledger summaries."
      }
      wrapChildren={false}
      actionButtons={
        <Button type="button" size="sm" variant="outline" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      {!view ? (
        <Card className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
          {loading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
              <p className="text-sm text-slate-500">Loading dashboard…</p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <p className="text-sm text-slate-700">{error ?? "Could not load dashboard"}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
                Retry
              </Button>
            </>
          )}
        </Card>
      ) : (
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>{error}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {view.summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="h-full min-w-0 p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {stat.label}
                  </p>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8"
                    style={{ backgroundColor: `${stat.accent}20`, color: stat.accent }}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <p className="mt-1.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
                  {stat.value}
                </p>
                {stat.sublabel && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                    {stat.sublabel}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {view.alerts.length > 0 && (
          <Card className="min-w-0">
            <CardHeader
              title="Needs attention"
              subtitle={`${view.alerts.length} item${view.alerts.length === 1 ? "" : "s"} to review`}
              action={
                <Link
                  href="/accounts/transactions/provisional-transactions"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
                >
                  <Bell className="h-3.5 w-3.5 text-amber-600" />
                  Provisional approvals
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {view.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className={cn(
                    "block min-w-0 rounded-lg border p-3 transition hover:shadow-sm",
                    alert.tone === "danger" && "border-red-200 bg-red-50 text-red-900",
                    alert.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                    alert.tone === "info" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                  )}
                >
                  <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs opacity-80">{alert.detail}</p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card className="min-w-0">
          <CardHeader title="Quick actions" subtitle="Accounts shortcuts" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="truncate text-xs text-slate-500">{link.hint}</p>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <DepartmentRevenueChart
            data={view.departmentData}
            title="Departmental Revenue Distribution"
            subtitle="Year-to-date revenue by division"
            emptyMessage="No division-wise revenue posted this year"
          />
          <BookingPlatformRevenueChart
            data={view.channelData}
            title="Booking Platform Revenue"
            subtitle="Year-to-date room revenue by booking channel"
            emptyMessage="No room revenue posted this year"
          />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <UpcomingVendorPayments payments={view.dashboard.upcomingVendorPayments} />

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Recent GL Vouchers"
              subtitle={`${view.dashboard.recentVouchers.length} latest posted entries`}
              action={
                <Link href="/accounts/transactions/gl-transaction">
                  <Button type="button" size="sm" variant="outline">
                    View all
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {view.dashboard.recentVouchers.map((trx) => {
                const tone = voucherTone(trx.status);
                return (
                  <li
                    key={trx.id}
                    onClick={() => setEditVoucherId(trx.id)}
                    title="Open to edit or delete"
                    className="-mx-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {trx.voucherNo}{" "}
                        <span className="font-normal text-slate-500">
                          · {trx.voucherTypeName ?? trx.voucherCategory}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {formatDate(trx.voucherDate)} · {trx.partyName || trx.narration || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{formatINR(trx.totalAmount)}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          tone === "emerald" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                          tone === "amber" && "bg-amber-50 text-amber-700 ring-amber-200",
                          tone === "red" && "bg-red-50 text-red-700 ring-red-200",
                        )}
                      >
                        {trx.status}
                      </span>
                    </div>
                  </li>
                );
              })}
              {view.dashboard.recentVouchers.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-500">No posted vouchers yet</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Party Outstanding"
              subtitle="Top aging balances"
              action={
                <Link href="/accounts/party-outstanding/bills-aging">
                  <Button type="button" size="sm" variant="outline">
                    Aging Report
                  </Button>
                </Link>
              }
            />
            <ul className="flex flex-1 flex-col divide-y divide-slate-100">
              {view.partyOutstanding.map((bill) => {
                const overdue = bill.overdueDays > 0;
                return (
                  <li
                    key={bill.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{bill.partyName ?? "—"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {bill.moduleType === "AR" ? "Debtor (AR)" : "Creditor (AP)"} · {bill.billNo} · Due:{" "}
                        {formatDate(bill.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{formatINR(bill.balance)}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          overdue
                            ? "bg-red-50 text-red-700 ring-red-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200",
                        )}
                      >
                        {overdue ? `Overdue ${bill.overdueDays}d` : "Pending"}
                      </span>
                    </div>
                  </li>
                );
              })}
              {view.partyOutstanding.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-500">No outstanding party bills</li>
              )}
            </ul>
          </Card>

          <Card className="flex h-full min-w-0 flex-col">
            <CardHeader
              title="Treasury & Bank Balances"
              subtitle="Liquid assets"
              action={
                <Link
                  href="/accounts/transactions/bank-reconciliation"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Details
                </Link>
              }
            />
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  {view.bankShare > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="3"
                      pathLength={100}
                      strokeDasharray={`${view.bankShare} ${100 - view.bankShare}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <span className="absolute text-sm font-bold text-slate-900">
                  {compactAmount(view.liquidTotal)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-slate-900">{formatINR(view.liquidTotal)}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Bank {formatINR(view.dashboard.kpis.bankBalance, { decimals: 0 })} · Cash{" "}
                  {formatINR(view.dashboard.kpis.cashBalance, { decimals: 0 })}
                </p>
              </div>
            </div>
            <div className="mt-auto space-y-2">
              {view.treasuryAccounts.map((acc) => (
                <div key={acc.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{acc.label}</span>
                    <span className="font-medium text-slate-900">{formatINR(acc.amount)}</span>
                  </div>
                  <ProgressBar value={acc.percent} max={100} color={acc.color} />
                </div>
              ))}
              {view.treasuryAccounts.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">No bank or cash balances yet</p>
              )}
            </div>
          </Card>

          <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            <CardHeader title="Recent activity" subtitle="Accounts audit log" />
            <ul className="min-h-0 max-h-[16.5rem] flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
              {view.activity.map((log) => (
                <li key={log.id} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-snug text-slate-700">{activityMessage(log)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(log.createdAt)}</p>
                  </div>
                </li>
              ))}
              {view.activity.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">No activity yet</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
      )}

      {editVoucherId && (
        <VoucherEditModal
          voucherId={editVoucherId}
          onClose={() => setEditVoucherId(null)}
          onChanged={() => void reload()}
        />
      )}
    </ModulePageShell>
  );
}
