"use client";

import Link from "next/link";
import { Clock, CreditCard, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface VendorPayment {
  id: string;
  vendorName: string;
  category: string;
  invoiceNo: string;
  dueDate: string;
  amount: string;
  status: "Due Today" | "Overdue" | "Due Soon" | "Scheduled";
  statusTone: "amber" | "red" | "emerald" | "sky";
}

const defaultVendorPayments: VendorPayment[] = [
  {
    id: "VP-101",
    vendorName: "Prime Supplies Ltd",
    category: "F&B Raw Materials",
    invoiceNo: "INV-2026-882",
    dueDate: "28 Jun 2026 (Today)",
    amount: "6,200.00",
    status: "Due Today",
    statusTone: "amber",
  },
  {
    id: "VP-102",
    vendorName: "Fresh Produce Wholesalers",
    category: "Kitchen & Perishables",
    invoiceNo: "INV-2026-904",
    dueDate: "22 Jun 2026",
    amount: "3,900.00",
    status: "Overdue",
    statusTone: "red",
  },
  {
    id: "VP-103",
    vendorName: "CleanLinen Laundry Services",
    category: "Housekeeping Linens",
    invoiceNo: "INV-2026-912",
    dueDate: "30 Jun 2026",
    amount: "4,150.00",
    status: "Due Soon",
    statusTone: "amber",
  },
  {
    id: "VP-104",
    vendorName: "City Energy & Utilities",
    category: "Electricity & Water",
    invoiceNo: "UTIL-JUN-2026",
    dueDate: "03 Jul 2026",
    amount: "8,500.00",
    status: "Scheduled",
    statusTone: "sky",
  },
  {
    id: "VP-105",
    vendorName: "TechServe Systems Ltd",
    category: "IT & PMS Maintenance",
    invoiceNo: "AM-2026-04",
    dueDate: "05 Jul 2026",
    amount: "2,750.00",
    status: "Scheduled",
    statusTone: "emerald",
  },
];

interface UpcomingVendorPaymentsProps {
  payments?: VendorPayment[];
}

export function UpcomingVendorPayments({
  payments = defaultVendorPayments,
}: UpcomingVendorPaymentsProps) {
  const totalUpcoming = payments.reduce((acc, p) => acc + parseFloat(p.amount.replace(/,/g, "")), 0);

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Vendor Payments</h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Accounts Payable schedule · Total: <span className="font-semibold text-slate-900">₹{totalUpcoming.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <Link href="/accounts/party-outstanding/bills-aging">
          <Button type="button" size="sm" variant="outline" className="gap-1 text-xs">
            AP Schedule
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
              <th className="pb-2 pl-1 pr-2">Vendor / Category</th>
              <th className="pb-2 px-2 text-center">Invoice Ref</th>
              <th className="pb-2 px-2 text-center">Due Date</th>
              <th className="pb-2 px-2 text-right">Amount (₹)</th>
              <th className="pb-2 pl-2 pr-1 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 pl-1 pr-2">
                  <p className="font-semibold text-slate-900 text-xs">{item.vendorName}</p>
                  <p className="text-[10px] text-slate-500">{item.category}</p>
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600">
                  {item.invoiceNo}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 text-[11px] whitespace-nowrap">
                  {item.dueDate}
                </td>
                <td className="py-2.5 px-2 text-right font-bold text-slate-900 text-xs whitespace-nowrap">
                  {item.amount}
                </td>
                <td className="py-2.5 pl-2 pr-1 text-right whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                      item.statusTone === "emerald" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                      item.statusTone === "amber" && "bg-amber-50 text-amber-800 ring-amber-200",
                      item.statusTone === "red" && "bg-red-50 text-red-700 ring-red-200",
                      item.statusTone === "sky" && "bg-sky-50 text-sky-700 ring-sky-200",
                    )}
                  >
                    {item.statusTone === "red" && <ShieldAlert className="h-2.5 w-2.5 shrink-0" />}
                    {item.statusTone === "amber" && <Clock className="h-2.5 w-2.5 shrink-0" />}
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
