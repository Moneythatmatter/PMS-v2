"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PRFulfillment,
  PRRequestedItem,
  PRStatus,
  PurchaseRequisition,
} from "@/app/data/purchaseRequisitionsData";

export const IN_PROGRESS_STATUSES: readonly PRStatus[] = ["Approved", "In Sourcing", "Partially Ordered"];
export const EDITABLE_STATUSES: readonly PRStatus[] = ["Draft", "Pending Approval", "Rejected"];
/** Statuses whose remaining quantity still counts as "already requested". */
export const OPEN_DEMAND_STATUSES: readonly PRStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "In Sourcing",
  "Partially Ordered",
];

const STATUS_TONE: Record<PRStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "In Sourcing": "bg-sky-50 text-sky-700 border-sky-200",
  "Partially Ordered": "bg-violet-50 text-violet-700 border-violet-200",
  Closed: "bg-teal-50 text-teal-700 border-teal-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-slate-50 text-slate-400 border-slate-200",
};

export function RequisitionStatusPill({ status, className }: { status: PRStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STATUS_TONE[status] ?? STATUS_TONE.Draft,
        className,
      )}
    >
      {status}
    </span>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  Emergency: "bg-red-50 text-red-700 border-red-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Medium: "bg-sky-50 text-sky-700 border-sky-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function PriorityPill({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase",
        PRIORITY_TONE[priority] ?? PRIORITY_TONE.Low,
      )}
    >
      {priority}
    </span>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatReqDate(value?: string | null) {
  if (!value) return "—";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${Number(iso[3])} ${MONTHS[Number(iso[2]) - 1]} ${iso[1]}`;
  return value;
}

export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatMoney(amount: number) {
  return `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatQty(qty: number) {
  return (Number(qty) || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

export function pendingQty(item: PRRequestedItem) {
  return Math.max(0, (Number(item.quantity) || 0) - (Number(item.receivedQty) || 0));
}

export function requisitionTotals(pr: PurchaseRequisition) {
  const items = pr.requestedItems ?? [];
  const requested = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const ordered = items.reduce((s, i) => s + Math.min(Number(i.orderedQty) || 0, Number(i.quantity) || 0), 0);
  const received = items.reduce((s, i) => s + Math.min(Number(i.receivedQty) || 0, Number(i.quantity) || 0), 0);
  return {
    requested,
    ordered,
    received,
    receivedPct: requested > 0 ? Math.round((received / requested) * 100) : 0,
  };
}

export function itemsSummary(items: PRRequestedItem[]) {
  if (!items.length) return "No items";
  const [first, ...rest] = items;
  const head = `${first.item} × ${formatQty(first.quantity)}`;
  return rest.length ? `${head} +${rest.length} more` : head;
}

export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "sky" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", tone === "emerald" ? "bg-emerald-500" : "bg-sky-500")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

type StepState = "done" | "current" | "pending" | "blocked";
type FlowStep = { key: string; label: string; state: StepState; hint: string };

/** Raised → Approval → RFQ / Direct PO → GRN → Stock, derived from status and line progress. */
export function requisitionFlow(pr: PurchaseRequisition, fulfillment?: PRFulfillment | null): FlowStep[] {
  const { requested, ordered, received } = requisitionTotals(pr);
  const approved = ["Approved", "In Sourcing", "Partially Ordered", "Closed"].includes(pr.status);
  const stopped = pr.status === "Rejected" || pr.status === "Cancelled";
  const rfq = fulfillment?.openRfq?.rfqNumber ?? fulfillment?.rfqs[0]?.rfqNumber;
  const pos = (fulfillment?.purchaseOrders ?? []).filter((p) => p.status !== "Cancelled").map((p) => p.poNumber);
  const fullyOrdered = requested > 0 && ordered >= requested;
  const fullyReceived = requested > 0 && received >= requested;

  const raised: FlowStep =
    pr.status === "Draft"
      ? { key: "raised", label: "Raised", state: "current", hint: "Draft — not submitted yet" }
      : { key: "raised", label: "Raised", state: "done", hint: formatReqDate(pr.requestDate) };

  let approval: FlowStep;
  if (approved) {
    approval = {
      key: "approval",
      label: "Approval",
      state: "done",
      hint: pr.approvedBy ? `By ${pr.approvedBy}` : "Approved",
    };
  } else if (stopped) {
    approval = { key: "approval", label: "Approval", state: "blocked", hint: pr.status };
  } else if (pr.status === "Pending Approval") {
    approval = { key: "approval", label: "Approval", state: "current", hint: `With ${pr.currentApprover || "Purchase"}` };
  } else {
    approval = { key: "approval", label: "Approval", state: "pending", hint: "Awaiting submission" };
  }

  let sourcing: FlowStep = { key: "sourcing", label: "RFQ / Direct PO", state: "pending", hint: "After approval" };
  if (fullyOrdered) {
    sourcing = { ...sourcing, state: "done", hint: pos.join(", ") || "Ordered" };
  } else if (approved) {
    sourcing = {
      ...sourcing,
      state: "current",
      hint: ordered > 0 ? `Partly ordered${pos.length ? ` · ${pos.join(", ")}` : ""}` : rfq ? `RFQ ${rfq}` : "Purchase is sourcing",
    };
  }

  let grn: FlowStep = { key: "grn", label: "GRN & QC", state: "pending", hint: "On delivery" };
  if (fullyReceived) grn = { ...grn, state: "done", hint: "All goods received" };
  else if (ordered > 0) grn = { ...grn, state: "current", hint: received > 0 ? "Partly received" : "Awaiting delivery" };

  let stock: FlowStep = { key: "stock", label: "In Stock", state: "pending", hint: "After QC" };
  if (fullyReceived) stock = { ...stock, state: "done", hint: `${formatQty(received)} posted` };
  else if (received > 0) stock = { ...stock, state: "current", hint: `${formatQty(received)} of ${formatQty(requested)} posted` };

  return [raised, approval, sourcing, grn, stock];
}

export function RequisitionFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="grid grid-cols-5 gap-2">
      {steps.map((step, idx) => (
        <li key={step.key} className="relative min-w-0">
          {idx > 0 && (
            <span
              aria-hidden
              className={cn(
                "absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2",
                step.state === "done" || step.state === "current" ? "bg-emerald-400" : "bg-slate-200",
              )}
            />
          )}
          <div className="relative flex flex-col items-center text-center">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                step.state === "done" && "border-emerald-500 bg-emerald-500 text-white",
                step.state === "current" && "border-emerald-500 bg-white text-emerald-700 ring-4 ring-emerald-100",
                step.state === "pending" && "border-slate-200 bg-white text-slate-400",
                step.state === "blocked" && "border-red-400 bg-red-50 text-red-600",
              )}
            >
              {step.state === "done" ? (
                <Check className="h-3.5 w-3.5" />
              ) : step.state === "blocked" ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                idx + 1
              )}
            </span>
            <span
              className={cn(
                "mt-1.5 text-[11px] font-bold",
                step.state === "pending" ? "text-slate-400" : "text-slate-800",
              )}
            >
              {step.label}
            </span>
            <span className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{step.hint}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
