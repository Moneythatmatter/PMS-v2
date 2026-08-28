"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Printer, Receipt } from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  posService,
  type FbPosBill,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { saveBillSlip } from "@/lib/food-beverages/print-slips";
import { cn } from "@/lib/utils";

const PAYMENT_TABS = [
  { id: "all", label: "All" },
  { id: "UNPAID", label: "Unpaid" },
  { id: "PAID", label: "Paid" },
] as const;

type PaymentTab = (typeof PAYMENT_TABS)[number]["id"];

function formatBillDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentBadge(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PAID") return "bg-emerald-100 text-emerald-800";
  if (normalized === "PARTIAL") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

const ALL_ORDERS_PATH = "/food-beverages/restaurants/all-orders";

function orderDetailHref(orderId: string) {
  return `${ALL_ORDERS_PATH}?orderId=${encodeURIComponent(orderId)}`;
}

export function FbBillsView() {
  const { outlets } = useFbOutlets(["all"]);
  const [outletId, setOutletId] = useState("");
  const [bills, setBills] = useState<FbPosBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  const outletNameById = useMemo(
    () => new Map(outlets.map((o) => [o.id, o.name])),
    [outlets],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await posService.listBills(outletId || undefined);
        if (!cancelled) {
          setBills(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setBills([]);
          setError(e instanceof Error ? e.message : "Failed to load bills");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  const outletLabel = outletId
    ? outletNameById.get(outletId) ?? "Outlet"
    : "All outlets";

  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((bill) => {
      if (paymentTab !== "all" && bill.paymentStatus.toUpperCase() !== paymentTab) {
        return false;
      }
      if (!q) return true;
      return (
        bill.billNo.toLowerCase().includes(q) ||
        bill.orderNo.toLowerCase().includes(q) ||
        bill.guest.toLowerCase().includes(q) ||
        bill.ref.toLowerCase().includes(q) ||
        bill.server.toLowerCase().includes(q)
      );
    });
  }, [bills, paymentTab, search]);

  const unpaidTotal = useMemo(
    () =>
      bills
        .filter((b) => b.paymentStatus.toUpperCase() !== "PAID")
        .reduce((sum, b) => sum + b.total, 0),
    [bills],
  );

  const paidTotal = useMemo(
    () =>
      bills
        .filter((b) => b.paymentStatus.toUpperCase() === "PAID")
        .reduce((sum, b) => sum + b.total, 0),
    [bills],
  );

  const reprintBillSlip = async (bill: FbPosBill) => {
    try {
      setReprintingId(bill.id);
      const details = await posService.getOrderDetails(bill.orderId);
      const items = (details.items as Record<string, unknown>[]).map((row) => ({
        name: String(row.name ?? "Item"),
        qty: Number(row.quantity ?? 1),
        price: Number(row.unitPrice ?? 0),
      }));
      saveBillSlip({
        billNo: bill.billNo,
        billId: bill.id,
        orderNo: bill.orderNo,
        orderType: bill.orderType,
        outletName: outletNameById.get(bill.outletId) ?? "Outlet",
        tableRef: bill.ref,
        guest: bill.guest,
        server: bill.server,
        lines: items,
        total: bill.total,
      });
      setToast(`${bill.billNo} reprinted`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to reprint bill");
    } finally {
      setReprintingId(null);
    }
  };

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Bills"
        description="Review printed bills, payment status, and re-download guest receipts."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Bills"
        description="Review printed bills, payment status, and re-download guest receipts."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Bills"
      description="Review printed bills, payment status, and re-download guest receipts."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect
          outlets={outlets}
          value={outletId}
          onChange={setOutletId}
          allowAll
        />
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search bill, order, guest, table…"
      stats={[
        {
          label: "Total bills",
          value: String(bills.length),
          accent: "#0f766e",
          sublabel: outletLabel,
        },
        {
          label: "Unpaid",
          value: formatINR(unpaidTotal),
          accent: "#d97706",
          sublabel: "Outstanding amount",
        },
        {
          label: "Paid",
          value: formatINR(paidTotal),
          accent: "#15803d",
          sublabel: "Settled amount",
        },
      ]}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPaymentTab(tab.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              paymentTab === tab.id
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Bill</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                {!outletId && <th className="px-4 py-3 font-semibold">Outlet</th>}
                <th className="px-4 py-3 font-semibold">Table / Ref</th>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Printed</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={outletId ? 8 : 9} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No bills found
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{bill.billNo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <Link
                        href={orderDetailHref(bill.orderId)}
                        className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {bill.orderNo}
                      </Link>
                      <div className="text-[11px] text-slate-400">{bill.orderType}</div>
                    </td>
                    {!outletId && (
                      <td className="px-4 py-3 text-slate-600">
                        {(outletNameById.get(bill.outletId) ?? bill.outletId) || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-600">{bill.ref || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{bill.guest}</div>
                      <div className="text-[11px] text-slate-400">{bill.server}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatINR(bill.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          paymentBadge(bill.paymentStatus),
                        )}
                      >
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatBillDate(bill.billPrintedAt ?? bill.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={reprintingId === bill.id}
                        onClick={() => void reprintBillSlip(bill)}
                        className="gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {reprintingId === bill.id ? "Printing…" : "Reprint"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ModulePageShell>
  );
}
