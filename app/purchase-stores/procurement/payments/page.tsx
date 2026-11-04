"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, IndianRupee, Receipt, Wallet } from "lucide-react";
import { FOPageHeader, StatMiniCard, AlertBanner, TextInput } from "@/components/frontoffice/ui";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import type { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { PODetailDrawer, paymentStatusBadge } from "@/components/purchase-stores/procurement/PODetailDrawer";
import { usePsList } from "@/hooks/usePsResource";
import { psPurchaseOrderService } from "@/services/purchase-stores/index";
import {
  PO_PAYMENT_MODES,
  isDirectPo,
  poPaymentSummary,
  type PORecord,
  type POPayment,
  type POPaymentStatus,
} from "@/app/data/purchaseOrdersData";
import { cn } from "@/lib/utils";

type PaymentRow = POPayment & {
  rowId: string;
  poId: string;
  poNumber: string;
  vendorName: string;
  department: string;
  poStatus: POPaymentStatus;
};

type OutstandingRow = {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  total: number;
  paid: number;
  balance: number;
  status: POPaymentStatus;
};

type View = "history" | "outstanding";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function PoStatusBadge({ status }: { status: PORecord["status"] }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200">
      {status}
    </span>
  );
}

export default function PurchasePaymentsPage() {
  const { data: poListRaw, loading, reload } = usePsList(() => psPurchaseOrderService.list(), []);
  const poList = useMemo(() => (poListRaw ?? []) as PORecord[], [poListRaw]);

  const [view, setView] = useState<View>("history");
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  const selectedPO = poList.find((p) => p.id === selectedPoId) ?? null;

  const payments = useMemo<PaymentRow[]>(
    () =>
      poList
        .flatMap((po) => {
          const poStatus = poPaymentSummary(po).status;
          return (po.payments ?? []).map((p) => ({
            ...p,
            amount: Number(p.amount) || 0,
            rowId: `${po.id}:${p.id}`,
            poId: po.id,
            poNumber: po.poNumber,
            vendorName: po.vendorName,
            department: po.department,
            poStatus,
          }));
        })
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.id.localeCompare(a.id)),
    [poList],
  );

  const outstanding = useMemo<OutstandingRow[]>(
    () =>
      poList
        .filter((po) => isDirectPo(po) && po.status !== "Cancelled")
        .map((po) => {
          const s = poPaymentSummary(po);
          return {
            id: po.id,
            poNumber: po.poNumber,
            vendorName: po.vendorName,
            orderDate: po.orderDate,
            total: s.total,
            paid: s.paid,
            balance: s.balance,
            status: s.status,
          };
        })
        .filter((r) => r.balance > 0.5)
        .sort((a, b) => b.balance - a.balance),
    [poList],
  );

  const q = search.trim().toLowerCase();

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        if (modeFilter !== "all" && p.paymentMode !== modeFilter) return false;
        if (from && p.paymentDate < from) return false;
        if (to && p.paymentDate > to) return false;
        if (!q) return true;
        return [p.poNumber, p.vendorName, p.reference, p.paidBy, p.remarks, p.paymentMode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      }),
    [payments, modeFilter, from, to, q],
  );

  const filteredOutstanding = useMemo(
    () =>
      outstanding.filter(
        (r) => !q || r.poNumber.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q),
      ),
    [outstanding, q],
  );

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    return {
      totalPaid: filteredPayments.reduce((s, p) => s + p.amount, 0),
      count: filteredPayments.length,
      thisMonth: payments.filter((p) => p.paymentDate.startsWith(month)).reduce((s, p) => s + p.amount, 0),
      outstanding: outstanding.reduce((s, r) => s + r.balance, 0),
      outstandingCount: outstanding.length,
    };
  }, [filteredPayments, payments, outstanding]);

  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: payments.length };
    for (const p of payments) counts[p.paymentMode] = (counts[p.paymentMode] ?? 0) + 1;
    return counts;
  }, [payments]);

  const handleRecordPayment = async (payment: POPayment) => {
    if (!selectedPO) return;
    const updated = await psPurchaseOrderService.update(selectedPO.id, {
      payments: [...(selectedPO.payments ?? []), payment],
    });
    if (!updated || !Array.isArray(updated.payments)) {
      throw new Error("Payments are not enabled yet — run sql/ps-po-payments.sql in Supabase.");
    }
    await reload();
    setToast({ message: `Payment of ${inr(payment.amount)} recorded for ${selectedPO.poNumber}.`, variant: "success" });
  };

  const historyColumns: ModuleColumn[] = [
    {
      key: "paymentDate",
      header: "Date",
      render: (r: PaymentRow) => <span className="text-slate-600">{r.paymentDate}</span>,
    },
    {
      key: "poNumber",
      header: "PO Number",
      render: (r: PaymentRow) => <span className="font-mono font-bold text-emerald-800">{r.poNumber}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor",
      render: (r: PaymentRow) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "paymentMode",
      header: "Mode",
      render: (r: PaymentRow) => <span className="font-semibold text-slate-700">{r.paymentMode}</span>,
    },
    {
      key: "reference",
      header: "Reference",
      render: (r: PaymentRow) => <span className="font-mono text-slate-500">{r.reference || "—"}</span>,
    },
    {
      key: "paidBy",
      header: "Paid By",
      render: (r: PaymentRow) => <span className="text-slate-600">{r.paidBy || "—"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r: PaymentRow) => <span className="font-extrabold text-emerald-900">{inr(r.amount)}</span>,
    },
    {
      key: "poStatus",
      header: "PO Payment",
      align: "center",
      render: (r: PaymentRow) => paymentStatusBadge(r.poStatus),
    },
  ];

  const outstandingColumns: ModuleColumn[] = [
    {
      key: "poNumber",
      header: "PO Number",
      render: (r: OutstandingRow) => <span className="font-mono font-bold text-emerald-800">{r.poNumber}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor",
      render: (r: OutstandingRow) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "orderDate",
      header: "Order Date",
      render: (r: OutstandingRow) => <span className="text-slate-600">{r.orderDate}</span>,
    },
    {
      key: "total",
      header: "PO Total",
      align: "right",
      render: (r: OutstandingRow) => <span className="font-semibold text-slate-900">{inr(r.total)}</span>,
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      render: (r: OutstandingRow) => <span className="font-semibold text-emerald-700">{inr(r.paid)}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (r: OutstandingRow) => <span className="font-extrabold text-red-600">{inr(r.balance)}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: OutstandingRow) => paymentStatusBadge(r.status),
    },
  ];

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}

      <FOPageHeader
        title="Payments"
        description="All payments recorded against direct purchase orders, and the balances still due to vendors"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Total Paid"
          value={inr(metrics.totalPaid)}
          sublabel={from || to || modeFilter !== "all" || q ? "Matching filters" : "All time"}
          icon={IndianRupee}
          accent="#059669"
        />
        <StatMiniCard
          label="Payments"
          value={metrics.count.toString()}
          sublabel="Transactions recorded"
          icon={Receipt}
          accent="#0d9488"
        />
        <StatMiniCard
          label="Paid This Month"
          value={inr(metrics.thisMonth)}
          sublabel={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          icon={CalendarDays}
          accent="#2563eb"
        />
        <StatMiniCard
          label="Outstanding"
          value={inr(metrics.outstanding)}
          sublabel={`${metrics.outstandingCount} direct PO(s) with balance`}
          icon={AlertCircle}
          accent="#dc2626"
        />
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold">
        {(
          [
            { id: "history", label: `Payment History (${payments.length})`, icon: Wallet },
            { id: "outstanding", label: `Outstanding POs (${outstanding.length})`, icon: AlertCircle },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors",
              view === t.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={view === "history" ? "Search PO #, vendor, reference…" : "Search PO #, vendor…"}
        showFilters={false}
        statusTabs={
          view === "history"
            ? [
                { id: "all", label: "All", count: modeCounts.all },
                ...PO_PAYMENT_MODES.map((m) => ({ id: m, label: m, count: modeCounts[m] ?? 0 })),
              ]
            : undefined
        }
        activeStatusTab={modeFilter}
        onStatusTabChange={setModeFilter}
        toolbarExtras={
          view === "history" ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TextInput
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                className="h-9 text-xs w-36"
                aria-label="From date"
              />
              <span>to</span>
              <TextInput
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                className="h-9 text-xs w-36"
                aria-label="To date"
              />
              {(from || to) && (
                <button
                  type="button"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading payments…
        </div>
      ) : view === "history" ? (
        <ModuleDataTable
          columns={historyColumns}
          rows={filteredPayments}
          getRowId={(r: PaymentRow) => r.rowId}
          onRowClick={(r: PaymentRow) => setSelectedPoId(r.poId)}
          emptyMessage="No payments recorded yet. Record payments from Purchase Orders → PO details → Payments."
          renderMobileCard={(r: PaymentRow) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.poNumber}</span>
                <span className="font-extrabold text-emerald-900 text-sm">{inr(r.amount)}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>
                  {r.paymentDate} · {r.paymentMode}
                  {r.reference ? ` · ${r.reference}` : ""}
                </span>
                {paymentStatusBadge(r.poStatus)}
              </div>
            </div>
          )}
        />
      ) : (
        <ModuleDataTable
          columns={outstandingColumns}
          rows={filteredOutstanding}
          onRowClick={(r: OutstandingRow) => setSelectedPoId(r.id)}
          emptyMessage="No outstanding balances — all direct POs are fully paid."
          renderMobileCard={(r: OutstandingRow) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.poNumber}</span>
                {paymentStatusBadge(r.status)}
              </div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  Paid {inr(r.paid)} of {inr(r.total)}
                </span>
                <span className="font-extrabold text-red-600 text-sm">{inr(r.balance)}</span>
              </div>
            </div>
          )}
        />
      )}

      <PODetailDrawer
        key={selectedPoId ?? "none"}
        po={selectedPO}
        invoices={[]}
        onClose={() => setSelectedPoId(null)}
        renderStatusBadge={(status) => <PoStatusBadge status={status} />}
        onApprovePO={() => setToast({ message: "Approve POs from the Purchase Orders page.", variant: "info" })}
        onRejectPO={() => setToast({ message: "Reject POs from the Purchase Orders page.", variant: "info" })}
        onApproveInvoice={() => undefined}
        onRejectInvoice={() => undefined}
        onRecordPayment={handleRecordPayment}
        initialTab="payments"
      />
    </div>
  );
}
