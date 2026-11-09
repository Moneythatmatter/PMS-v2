"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ClipboardCheck, FileText, Loader2, Plus, Upload, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { cn } from "@/lib/utils";
import {
  PO_PAYMENT_MODES,
  isDirectPo,
  poPaymentSummary,
  type PORecord,
  type POPayment,
  type POPaymentStatus,
} from "@/app/data/purchaseOrdersData";
import { FormField, SelectInput, TextInput } from "@/components/frontoffice/ui";
import type { GRNRecord } from "@/app/data/grnData";
import type { InvoiceRecord } from "@/app/data/invoiceVerificationData";
import { usePsList } from "@/hooks/usePsResource";
import { psGrnService } from "@/services/purchase-stores/index";

type LifecycleState = "done" | "current" | "failed" | "upcoming";

/** Procurement lifecycle for a PO — mirrors the GRN receiving stepper. */
function poLifecycle(
  po: PORecord,
  grns: GRNRecord[],
): Array<{ label: string; state: LifecycleState }> {
  if (po.status === "Cancelled") {
    return [
      { label: "PO Created", state: "done" },
      { label: "Cancelled", state: "failed" },
      { label: "Goods Received (GRN)", state: "upcoming" },
      { label: "Posted to Stock", state: "upcoming" },
    ];
  }

  const approved =
    po.status === "Approved" || po.status === "Issued" || po.status === "Closed";
  const pendingApproval = po.status === "Pending Approval";
  const hasGrn = grns.length > 0;
  const rejected = grns.some(
    (g) => g.inspectionStatus === "Rejected" || g.status === "Return",
  );
  const stocked = grns.some(
    (g) =>
      g.status === "Completed" ||
      g.status === "Approved" ||
      g.inspectionStatus === "Passed" ||
      g.inspectionStatus === "Partially Accepted",
  );
  const closed = po.status === "Closed";

  const created: LifecycleState = "done";

  let approvedStep: LifecycleState;
  if (approved) approvedStep = "done";
  else if (pendingApproval) approvedStep = "current";
  else approvedStep = "current"; // Draft

  let grnStep: LifecycleState;
  if (!approved) grnStep = "upcoming";
  else if (hasGrn) grnStep = "done";
  else grnStep = "current";

  let stockStep: LifecycleState;
  if (rejected && !stocked) stockStep = "failed";
  else if (stocked || closed) stockStep = "done";
  else if (hasGrn) stockStep = "current";
  else stockStep = "upcoming";

  return [
    { label: "PO Created", state: created },
    {
      label: pendingApproval ? "Pending Approval" : "PO Approved",
      state: approvedStep,
    },
    {
      label: hasGrn ? `Goods Received (${grns[0]?.grnNumber ?? "GRN"})` : "Goods Received (GRN)",
      state: grnStep,
    },
    {
      label: rejected && !stocked ? "QC Rejected / Return" : "Posted to Stock",
      state: stockStep,
    },
  ];
}

function poLifecycleCurrentLabel(
  steps: Array<{ label: string; state: LifecycleState }>,
  po: PORecord,
): string {
  const current = steps.find((s) => s.state === "current");
  if (current) return current.label;
  if (steps.some((s) => s.state === "failed")) return "QC rejected — return to vendor";
  if (po.status === "Closed") return "Closed";
  if (steps.every((s) => s.state === "done")) return "Completed — stock posted";
  return po.status;
}

type POTab = "details" | "items" | "payments" | "grns" | "invoices";

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

const PAYMENT_STATUS_STYLES: Record<POPaymentStatus, string> = {
  Unpaid: "bg-red-50 text-red-700",
  "Partially Paid": "bg-amber-50 text-amber-700",
  Paid: "bg-emerald-50 text-emerald-700",
};

export function paymentStatusBadge(status: POPaymentStatus) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", PAYMENT_STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function RecordPaymentForm({
  balance,
  onSave,
  onCancel,
}: {
  balance: number;
  onSave: (payment: POPayment) => Promise<void>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState<number>(balance);
  const [date, setDate] = useState(todayIso);
  const [mode, setMode] = useState<string>(PO_PAYMENT_MODES[0]);
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!(amount > 0)) return setError("Enter the amount paid.");
    if (amount > balance + 0.5) return setError(`Amount cannot exceed the balance of ₹${balance.toLocaleString("en-IN")}.`);
    if (mode !== "Cash" && !reference.trim()) return setError(`Enter the ${mode} transaction reference.`);
    setError("");
    setSaving(true);
    try {
      await onSave({
        id: `PAY-${Date.now()}`,
        paymentDate: date,
        amount,
        paymentMode: mode,
        reference: reference.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount (₹)" required>
          <TextInput
            type="number"
            min={0}
            value={amount || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
            className="h-9 text-xs font-bold"
          />
        </FormField>
        <FormField label="Payment Date" required>
          <TextInput
            type="date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
            className="h-9 text-xs"
          />
        </FormField>
        <FormField label="Payment Mode" required>
          <SelectInput
            value={mode}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMode(e.target.value)}
            className="h-9 text-xs"
          >
            {PO_PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Transaction / Receipt Ref" required={mode !== "Cash"}>
          <TextInput
            value={reference}
            placeholder={mode === "Cash" ? "Optional" : "UTR / cheque no."}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
            className="h-9 text-xs font-mono"
          />
        </FormField>
        <FormField label="Remarks" className="col-span-2">
          <TextInput
            value={remarks}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)}
            className="h-9 text-xs"
          />
        </FormField>
      </div>
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
          onClick={submit}
          disabled={saving}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Payment
        </Button>
      </div>
    </div>
  );
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
  onRecordPayment?: (payment: POPayment) => Promise<void>;
  initialTab?: POTab;
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
  onRecordPayment,
  initialTab = "details",
}: PODetailDrawerProps) {
  const [tab, setTab] = useState<POTab>(initialTab);
  const [recording, setRecording] = useState(false);

  const { data: grns, loading: grnsLoading } = usePsList(
    () => (po ? psGrnService.listByPo(po.poNumber) : Promise.resolve([])),
    [po?.poNumber ?? ""],
  );

  const matchStatus = po ? deriveMatchStatus(invoices, grns) : "Not Received";

  if (!po) return null;

  const direct = isDirectPo(po);
  const pay = poPaymentSummary(po);
  const canRecordPayment = direct && Boolean(onRecordPayment) && po.status !== "Cancelled" && pay.balance > 0.5;

  const tabs: { id: POTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "items", label: "Items" },
    ...(direct || pay.paid > 0 ? [{ id: "payments" as const, label: "Payments" }] : []),
    { id: "grns", label: "Goods Receipts" },
    { id: "invoices", label: "Vendor Invoices" },
  ];

  return (
    <Drawer
      side="bottom"
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
        {/* Procurement lifecycle — keep at top, same pattern as GRN */}
        {(() => {
          const steps = poLifecycle(po, grns);
          const stageLabel = poLifecycleCurrentLabel(steps, po);
          return (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-extrabold text-amber-900">{po.poNumber}</span>
                {renderStatusBadge(po.status)}
              </div>
              <div className="border-t border-amber-200/80 pt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
                    Procurement Lifecycle
                  </h5>
                  <span className="text-[11px] font-semibold text-amber-900">
                    Current stage: <strong>{stageLabel}</strong>
                  </span>
                </div>
                {grnsLoading ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-amber-800/80">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading receipt status…
                  </p>
                ) : (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-none">
                    {steps.map((step, i) => (
                      <React.Fragment key={`${step.label}-${i}`}>
                        {i > 0 && (
                          <div
                            className={cn(
                              "h-0.5 min-w-4 flex-1 rounded",
                              step.state === "upcoming" ? "bg-amber-200" : "bg-emerald-400",
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1",
                            step.state === "done" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                            step.state === "current" && "border-amber-600 bg-amber-600 text-white shadow-sm",
                            step.state === "failed" && "border-rose-600 bg-rose-600 text-white shadow-sm",
                            step.state === "upcoming" && "border-slate-200 bg-white text-slate-400",
                          )}
                        >
                          {step.state === "done" && <Check className="h-3 w-3" />}
                          {step.state === "current" && (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          )}
                          {step.state === "failed" && <XCircle className="h-3 w-3" />}
                          {step.label}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-extrabold text-emerald-900">{po.poNumber}</span>
            {renderStatusBadge(po.status)}
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1">{po.vendorName}</h3>
          <p className="text-xs text-slate-500">{po.department} · Buyer: {po.buyerName}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm font-bold text-emerald-800">₹{po.totalAmount.toLocaleString("en-IN")}</p>
            {direct && paymentStatusBadge(pay.status)}
          </div>
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
              {t.id === "payments" && (po.payments?.length ?? 0) > 0 && ` (${po.payments?.length})`}
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

        {tab === "payments" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: "PO Total", value: pay.total, tone: "text-slate-900" },
                { label: "Paid", value: pay.paid, tone: "text-emerald-700" },
                { label: "Balance", value: pay.balance, tone: pay.balance > 0.5 ? "text-red-600" : "text-slate-900" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-slate-200 p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{c.label}</span>
                  <span className={cn("font-bold", c.tone)}>₹{c.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {recording && onRecordPayment ? (
              <RecordPaymentForm
                balance={pay.balance}
                onCancel={() => setRecording(false)}
                onSave={async (p) => {
                  await onRecordPayment(p);
                  setRecording(false);
                }}
              />
            ) : (
              canRecordPayment && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full h-9 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={() => setRecording(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Record Payment
                </Button>
              )
            )}

            {(po.payments ?? []).length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <Wallet className="h-5 w-5 mx-auto text-slate-300 mb-2" />
                No payments recorded yet.
              </div>
            ) : (
              [...(po.payments ?? [])]
                .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                .map((p) => (
                  <div key={p.id} className="flex justify-between items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {p.paymentMode}
                        {p.reference && <span className="font-mono text-slate-500"> · {p.reference}</span>}
                      </p>
                      <p className="text-slate-500">
                        {p.paymentDate}
                        {p.paidBy ? ` · ${p.paidBy}` : ""}
                        {p.remarks ? ` · ${p.remarks}` : ""}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-800">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                  </div>
                ))
            )}
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
