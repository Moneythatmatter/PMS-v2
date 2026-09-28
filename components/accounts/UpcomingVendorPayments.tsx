"use client";

import Link from "next/link";
import { Clock, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AccountsDashboard } from "@/services/accounts";
import { formatDate, formatINR } from "@/components/accounts/accountsApi";

export type VendorPayment = AccountsDashboard["upcomingVendorPayments"][number];

interface UpcomingVendorPaymentsProps {
  payments: VendorPayment[];
}

const statusTone: Record<VendorPayment["status"], "red" | "amber" | "sky"> = {
  Overdue: "red",
  "Due Today": "amber",
  Upcoming: "sky",
};

export function UpcomingVendorPayments({ payments }: UpcomingVendorPaymentsProps) {
  const totalUpcoming = payments.reduce((acc, p) => acc + p.balance, 0);

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader
        title="Upcoming Vendor Payments"
        subtitle={`Accounts Payable · Next 30 days · Total ${formatINR(totalUpcoming)}`}
        action={
          <div className="flex gap-2">
            <Link href="/accounts/transactions/gl-receipts-payments">
              <Button type="button" size="sm" variant="outline">
                Pay
              </Button>
            </Link>
            <Link href="/accounts/party-outstanding/bills-aging">
              <Button type="button" size="sm" variant="outline" className="gap-1">
                AP Schedule
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
              <th className="pb-2 pl-1 pr-2">Vendor / Bill Date</th>
              <th className="pb-2 px-2 text-center">Invoice Ref</th>
              <th className="pb-2 px-2 text-center">Due Date</th>
              <th className="pb-2 px-2 text-right">Balance (₹)</th>
              <th className="pb-2 pl-2 pr-1 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((item) => {
              const tone = statusTone[item.status];
              return (
                <tr key={item.billId} className="transition-colors hover:bg-slate-50/70">
                  <td className="py-3 pl-1 pr-2">
                    <p className="text-sm font-medium text-slate-900">{item.partyName ?? "—"}</p>
                    <p className="text-xs text-slate-500">Billed {formatDate(item.billDate)}</p>
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-xs text-slate-600">
                    {item.billNo}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-center text-xs text-slate-600">
                    {formatDate(item.dueDate)}
                    {item.overdueDays > 0 && (
                      <span className="block text-[11px] text-red-600">{item.overdueDays} days overdue</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-right text-sm font-semibold text-slate-900">
                    {formatINR(item.balance, { symbol: false })}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-2 pr-1 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                        tone === "amber" && "bg-amber-50 text-amber-800 ring-amber-200",
                        tone === "red" && "bg-red-50 text-red-700 ring-red-200",
                        tone === "sky" && "bg-sky-50 text-sky-700 ring-sky-200",
                      )}
                    >
                      {tone === "red" && <ShieldAlert className="h-3 w-3 shrink-0" />}
                      {tone === "amber" && <Clock className="h-3 w-3 shrink-0" />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No vendor bills due in the next 30 days
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
