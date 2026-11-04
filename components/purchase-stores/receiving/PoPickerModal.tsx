"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CalendarDays, Check, FileText, PackageSearch, Search, Truck, Warehouse, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PO_SOURCE_LABELS, poSource, type PORecord } from "@/app/data/purchaseOrdersData";

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

function fmtDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-0.5 truncate text-xs font-medium text-slate-800", mono && "font-mono")} title={value || undefined}>
        {value?.trim() || "—"}
      </p>
    </div>
  );
}

export function PoPickerModal({
  open,
  onClose,
  purchaseOrders,
  selectedPoNumber,
  onSelect,
  hiddenCount,
}: {
  open: boolean;
  onClose: () => void;
  purchaseOrders: PORecord[];
  selectedPoNumber: string;
  onSelect: (poNumber: string) => void;
  /** Approved POs left out because they already have a GRN. */
  hiddenCount: number;
}) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(selectedPoNumber);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...purchaseOrders]
      .filter(
        (po) =>
          !q ||
          [po.poNumber, po.vendorName, po.department, po.shipToWarehouse, ...po.items.map((i) => i.productName)].some((v) =>
            v?.toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => (a.expectedDeliveryDate || "9999").localeCompare(b.expectedDeliveryDate || "9999"));
  }, [purchaseOrders, search]);

  const active = list.find((po) => po.poNumber === focused) ?? list[0] ?? null;

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="po-picker-title"
        className="relative flex h-[min(88dvh,760px)] max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="po-picker-title" className="text-base font-bold text-slate-900">Select Purchase Order</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Approved POs waiting for goods receipt.
              {hiddenCount > 0 && ` ${hiddenCount} PO${hiddenCount === 1 ? "" : "s"} already received (GRN created) are hidden.`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b border-slate-100 md:border-b-0 md:border-r">
            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search PO, vendor, item, warehouse…"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
              {list.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-slate-500">
                  <PackageSearch className="h-8 w-8 text-slate-300" />
                  {purchaseOrders.length === 0 ? "No approved POs are waiting for receipt." : "No POs match your search."}
                </li>
              )}
              {list.map((po) => {
                const overdue = Boolean(po.expectedDeliveryDate) && po.expectedDeliveryDate < today();
                const isActive = active?.poNumber === po.poNumber;
                return (
                  <li key={po.id}>
                    <button
                      type="button"
                      onClick={() => setFocused(po.poNumber)}
                      onDoubleClick={() => onSelect(po.poNumber)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        isActive ? "border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800">{po.poNumber}</span>
                        <span className="text-xs font-bold text-slate-900">{inr(po.totalAmount)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{po.vendorName || "—"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span>{po.items.length} item{po.items.length === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span className="truncate">{po.shipToWarehouse || "No warehouse"}</span>
                        {po.expectedDeliveryDate && (
                          <span className={cn("rounded px-1.5 py-0.5 font-semibold", overdue ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
                            {overdue ? "Overdue" : "Due"} {fmtDate(po.expectedDeliveryDate)}
                          </span>
                        )}
                        {po.poNumber === selectedPoNumber && <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800">Selected</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="min-h-0 overflow-y-auto bg-slate-50/50 p-5">
            {!active ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
                <FileText className="h-8 w-8 text-slate-300" />
                Pick a purchase order to see its details.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">{active.vendorName || "—"}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-emerald-800">{active.poNumber}</span> · {active.status} · {PO_SOURCE_LABELS[poSource(active)]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order value</p>
                    <p className="text-xl font-bold text-slate-900">{inr(active.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-4">
                  <Field label="PO date" value={fmtDate(active.orderDate)} />
                  <Field label="Expected delivery" value={fmtDate(active.expectedDeliveryDate)} />
                  <Field label="Deliver to" value={[active.shipToWarehouse, active.dockGate].filter(Boolean).join(" · ")} />
                  <Field label="Department" value={active.department} />
                  <Field label="Contact" value={[active.contactPerson, active.vendorPhone].filter(Boolean).join(" · ")} />
                  <Field label="GSTIN" value={active.gstin} mono />
                  <Field label="Buyer" value={active.buyerName} />
                  <Field label="Linked" value={active.linkedRFQ || active.linkedPR || "Direct"} mono />
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">Ordered items</p>
                    <p className="text-xs text-slate-500">{active.items.length} line{active.items.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Tax</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {active.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">
                              <p className="font-semibold text-slate-900">{item.productName || item.itemDescription}</p>
                              <p className="font-mono text-[10px] text-slate-400">{item.productCode || item.itemCode}{item.category ? ` · ${item.category}` : ""}</p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{item.quantity} {item.unit}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{inr(item.unitRate)}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-500">{item.taxPercent ? `${item.taxPercent}%` : "—"}</td>
                            <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-slate-900">{inr(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-slate-200 bg-slate-50/70">
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right text-slate-500">Sub-total · Tax</td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-700">{inr(active.subTotal)} · {inr(active.taxAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right font-semibold text-slate-700">Total</td>
                          <td className="px-4 py-2 text-right font-bold tabular-nums text-slate-900">{inr(active.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Ordered {fmtDate(active.orderDate)}</span>
                  <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {active.freightTerms || "Freight not set"}</span>
                  <span className="inline-flex items-center gap-1"><Warehouse className="h-3.5 w-3.5" /> {active.shipToWarehouse || "—"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <p className="text-xs text-slate-500">
            {list.length} PO{list.length === 1 ? "" : "s"} available · double-click to select
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              disabled={!active}
              onClick={() => active && onSelect(active.poNumber)}
              className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <Check className="h-4 w-4" /> Receive against {active?.poNumber ?? "PO"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
