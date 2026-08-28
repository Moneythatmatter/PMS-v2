"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { cn } from "@/lib/utils";
import type { PORecord } from "@/app/data/purchaseOrdersData";
import type { GRNRecord } from "@/app/data/grnData";
import type { InvoiceRecord } from "@/app/data/invoiceVerificationData";
import { usePsList } from "@/hooks/usePsResource";
import { psGrnService } from "@/services/purchase-stores/index";

type POTab = "details" | "items" | "grns" | "invoices";

export type POMatchStatus = "Not Received" | "Partially Received" | "Received" | "Invoice Pending" | "Matched" | "Mismatch";

function deriveMatchStatus(invoices: InvoiceRecord[], grns: GRNRecord[]): POMatchStatus {
  if (grns.length === 0) return "Not Received";
  if (invoices.length === 0) return "Invoice Pending";

  const hasMismatch = invoices.some((i) => i.verificationResult === "Mismatch" || i.verificationResult === "Rejected");
  if (hasMismatch) return "Mismatch";

  const allMatched = invoices.every(
    (i) => i.verificationResult === "Matched" || i.status === "Approved for Payment",
  );
  if (allMatched) return "Matched";

  return "Invoice Pending";
}

function matchStatusBadge(status: POMatchStatus) {
  const styles: Record<POMatchStatus, string> = {
    "Not Received": "bg-slate-100 text-slate-600",
    "Partially Received": "bg-blue-50 text-blue-700",
    Received: "bg-teal-50 text-teal-700",
    "Invoice Pending": "bg-amber-50 text-amber-700",
    Matched: "bg-emerald-50 text-emerald-700",
    Mismatch: "bg-red-50 text-red-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", styles[status])}>
      {status}
    </span>
  );
}

interface PODetailDrawerProps {
  po: PORecord | null;
  invoices: InvoiceRecord[];
  onClose: () => void;
  renderStatusBadge: (status: PORecord["status"]) => React.ReactNode;
  onApprovePO: () => void;
  onRejectPO: () => void;
  onApproveInvoice: (invoiceId: string) => void;
  onRejectInvoice: (invoiceId: string) => void;
}

export function PODetailDrawer({
  po,
  invoices,
  onClose,
  renderStatusBadge,
  onApprovePO,
  onRejectPO,
  onApproveInvoice,
  onRejectInvoice,
}: PODetailDrawerProps) {
  const [tab, setTab] = useState<POTab>("details");

  const { data: grns, loading: grnsLoading } = usePsList(
    () => (po ? psGrnService.listByPo(po.poNumber) : Promise.resolve([])),
    [po?.poNumber ?? ""],
  );

  const matchStatus = po ? deriveMatchStatus(invoices, grns) : "Not Received";

  if (!po) return null;

  const tabs: { id: POTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "items", label: "Items" },
    { id: "grns", label: "Goods Receipts" },
    { id: "invoices", label: "Vendor Invoices" },
  ];

  return (
    <Drawer
      open={Boolean(po)}
      onClose={onClose}
      title={po.poNumber}
      description={`${po.vendorName} · Match: ${matchStatus}`}
      width="lg"
      footer={
        <DocumentApprovalFooter
          showApprovalActions={po.status === "Pending Approval"}
          onApprove={onApprovePO}
          onReject={onRejectPO}
          onClose={onClose}
          approveLabel="Approve PO"
          rejectLabel="Reject PO"
          extraActions={
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Match:</span>
              {matchStatusBadge(matchStatus)}
              <Link href="/purchase-stores/receiving/grn">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8">
                  <ClipboardCheck className="h-3.5 w-3.5" /> GRN
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      <div className="space-y-4 pb-4 select-none">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-extrabold text-emerald-900">{po.poNumber}</span>
            {renderStatusBadge(po.status)}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1">{po.vendorName}</h3>
          <p className="text-xs text-slate-500">{po.department} · Buyer: {po.buyerName}</p>
          <p className="text-sm font-bold text-emerald-800 mt-2">₹{po.totalAmount.toLocaleString("en-IN")}</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
                tab === t.id ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {t.label}
              {t.id === "grns" && grns.length > 0 && ` (${grns.length})`}
              {t.id === "invoices" && invoices.length > 0 && ` (${invoices.length})`}
            </button>
          ))}
        </div>

        {tab === "details" && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Linked PR</span><span className="font-mono">{po.linkedPR?.trim() ? po.linkedPR : "Direct Procurement"}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Linked RFQ</span><span className="font-mono">{po.linkedRFQ ?? "—"}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Order Date</span><span>{po.orderDate}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Expected Delivery</span><span>{po.expectedDeliveryDate}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Ship To</span><span>{po.shipToWarehouse}</span></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Terms</span><span>{po.paymentTerms}</span></div>
            <div className="col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600">
              PO is created by the hotel — no vendor invoice is generated automatically. Upload vendor invoices after delivery under the Vendor Invoices tab.
            </div>
          </div>
        )}

        {tab === "items" && (
          <div className="space-y-2">
            {po.items.map((i) => (
              <div key={i.id} className="flex justify-between items-center rounded-lg border border-slate-200 p-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{i.productName || i.itemDescription}</p>
                  <p className="text-slate-500">{i.productCode || i.itemCode} · {i.quantity} {i.unit} @ ₹{i.unitRate}</p>
                </div>
                <span className="font-bold text-emerald-800">₹{i.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "grns" && (
          <div className="space-y-2">
            {grnsLoading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : grns.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <p>No goods receipts yet.</p>
                <Link href="/purchase-stores/receiving/grn" className="text-emerald-700 hover:underline text-xs mt-2 inline-block">
                  Create GRN against this PO
                </Link>
              </div>
            ) : (
              grns.map((g) => (
                <div key={g.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono font-semibold text-slate-900">{g.grnNumber}</span>
                    <span className="text-emerald-700 font-semibold">{g.status}</span>
                  </div>
                  <p className="text-slate-500 mt-1">{g.receiptDate} · {g.warehouse} · {g.itemCount} items</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs">
              <Upload className="h-5 w-5 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">Upload vendor invoice</p>
              <p className="text-slate-500 mt-1">Link to {po.poNumber} and related GRN(s) for 3-way match.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => alert("Invoice upload — link to PO + GRN")}>
                <FileText className="h-3.5 w-3.5" /> Upload Invoice
              </Button>
            </div>
            {invoices.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No vendor invoices linked yet.</p>
            ) : (
              invoices.map((inv) => {
                const canApprove = inv.status === "Pending Verification" && inv.verificationResult !== "Matched";
                return (
                  <div key={inv.id} className="rounded-lg border border-slate-200 p-3 text-xs space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-mono font-semibold text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-slate-500">{inv.invoiceDate} · GRN: {inv.grnNumber}</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
                        inv.verificationResult === "Matched" || inv.status === "Approved for Payment"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.verificationResult === "Rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      )}>
                        {inv.status === "Approved for Payment" ? "Approved for Payment" : inv.verificationResult}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">₹{inv.invoiceAmount.toLocaleString("en-IN")}</p>
                    {canApprove && (
                      <div className="flex gap-2 pt-1 border-t border-slate-100">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] text-red-600" onClick={() => onRejectInvoice(inv.id)}>
                          Reject
                        </Button>
                        <Button type="button" size="sm" className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => onApproveInvoice(inv.id)}>
                          Approve 3-Way Match
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
