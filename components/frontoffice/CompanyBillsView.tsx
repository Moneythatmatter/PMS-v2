"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  AlertBanner,
  EmptyState,
  FOPageHeader,
  FormField,
  SelectInput,
  TextAreaInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { companyBillService, type CompanyBillDto } from "@/services/front-office/groups";
import { ApiError } from "@/services/api";
import { allBookingsDetailHref } from "@/lib/check-in-navigation";
import { cn } from "@/lib/utils";

type StatusFilter = "" | "Open" | "Void";

function postingLabel(b: CompanyBillDto): { text: string; tone: string } {
  if (b.status === "Void") {
    if (b.voidVoucherNo) return { text: `Reversed in ${b.voidVoucherNo}`, tone: "text-slate-500" };
    if (b.voucherNo) return { text: "Reversal at next Night Audit", tone: "text-amber-700" };
    return { text: "Never posted", tone: "text-slate-500" };
  }
  if (b.voucherNo) {
    return {
      text: `${b.voucherNo}${b.voucherStatus === "Draft" ? " (draft)" : ""}`,
      tone: b.voucherStatus === "Draft" ? "text-amber-700" : "text-emerald-700",
    };
  }
  return { text: "Posts at Night Audit", tone: "text-slate-500" };
}

export function CompanyBillsView() {
  const [status, setStatus] = useState<StatusFilter>("Open");
  const [rows, setRows] = useState<CompanyBillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [voidTarget, setVoidTarget] = useState<CompanyBillDto | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSaving, setVoidSaving] = useState(false);
  const [voidError, setVoidError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    companyBillService
      .list(status)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load company bills");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, reloadKey]);

  const load = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const openVoid = (b: CompanyBillDto) => {
    setVoidTarget(b);
    setVoidReason("");
    setVoidError("");
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      setVoidError("Enter the reason for voiding this bill.");
      return;
    }
    setVoidSaving(true);
    setVoidError("");
    try {
      await companyBillService.void(voidTarget.id, voidReason.trim());
      setToast(
        `${voidTarget.billNo} voided — ${formatINR(voidTarget.amount)} is back on the folio for collection.`,
      );
      setVoidTarget(null);
      load();
    } catch (e) {
      setVoidError(e instanceof ApiError ? e.message : "Failed to void the bill");
    } finally {
      setVoidSaving(false);
    }
  };

  const openTotal = rows.filter((r) => r.status === "Open").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title="Company Bills"
        description="Folio balances billed to companies at checkout or from a group master folio"
        action={
          <div className="flex items-center gap-2">
            <SelectInput
              value={status}
              onChange={(e) => {
                setLoading(true);
                setStatus(e.target.value as StatusFilter);
              }}
              className="h-9 w-36"
            >
              <option value="Open">Open</option>
              <option value="Void">Void</option>
              <option value="">All</option>
            </SelectInput>
            <Button type="button" size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      {toast ? <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} /> : null}
      {error ? <AlertBanner variant="error" message={error} onDismiss={() => setError("")} /> : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">
            {rows.length} bill{rows.length === 1 ? "" : "s"}
          </p>
          {openTotal > 0 ? (
            <p className="text-sm text-slate-600">
              Open total <span className="font-semibold text-slate-900">{formatINR(openTotal)}</span>
            </p>
          ) : null}
        </div>

        {loading && !rows.length ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No company bills" description="Bills appear here when a folio balance is billed to a company." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-2.5 pr-3 font-medium">Bill</th>
                  <th className="pb-2.5 pr-3 font-medium">Date</th>
                  <th className="pb-2.5 pr-3 font-medium">Company</th>
                  <th className="pb-2.5 pr-3 font-medium">Stay / group</th>
                  <th className="pb-2.5 pr-3 text-right font-medium">Amount</th>
                  <th className="pb-2.5 pr-3 font-medium">Accounts</th>
                  <th className="pb-2.5 pr-3 font-medium">Status</th>
                  <th className="pb-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((b) => {
                  const posting = postingLabel(b);
                  const paid = b.settledAmount > 0;
                  return (
                    <tr key={b.id} className="align-top hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-semibold text-slate-800">{b.billNo}</td>
                      <td className="py-3 pr-3 text-slate-600">{String(b.businessDate).slice(0, 10)}</td>
                      <td className="py-3 pr-3 text-slate-700">{b.partyName ?? "—"}</td>
                      <td className="py-3 pr-3 text-slate-600">
                        {b.groupId ? (
                          <Link
                            href={`/frontoffice/group-booking/${encodeURIComponent(b.groupId)}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {b.groupNo ?? "Group"}
                            {b.groupName ? ` · ${b.groupName}` : ""}
                          </Link>
                        ) : b.reservationId ? (
                          <Link
                            href={allBookingsDetailHref({ id: b.reservationId })}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {b.bookingNo ?? "Booking"}
                            {b.guestName ? ` · ${b.guestName}` : ""}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {b.notes ? <p className="mt-0.5 text-xs text-slate-400">{b.notes}</p> : null}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium text-slate-900">{formatINR(b.amount)}</td>
                      <td className={cn("py-3 pr-3 text-xs font-medium", posting.tone)}>
                        {posting.text}
                        {paid ? (
                          <p className="text-emerald-700">Company paid {formatINR(b.settledAmount)}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            b.status === "Open" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {b.status}
                        </span>
                        {b.status === "Void" && b.voidReason ? (
                          <p className="mt-1 max-w-[180px] text-xs text-slate-400">{b.voidReason}</p>
                        ) : null}
                      </td>
                      <td className="py-3 text-right">
                        {b.status === "Open" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 border-rose-200 px-2.5 text-xs text-rose-700 hover:bg-rose-50"
                            disabled={paid || b.voucherStatus === "Draft"}
                            title={
                              paid
                                ? "The company has paid against this bill — remove the settlement in Accounts first"
                                : b.voucherStatus === "Draft"
                                  ? "Post or delete the Front Office draft voucher first"
                                  : undefined
                            }
                            onClick={() => openVoid(b)}
                          >
                            <Ban className="h-3 w-3" />
                            Void
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(voidTarget)}
        onClose={() => {
          if (!voidSaving) setVoidTarget(null);
        }}
        title={`Void ${voidTarget?.billNo ?? "company bill"}`}
        description={
          voidTarget
            ? `${formatINR(voidTarget.amount)} billed to ${voidTarget.partyName ?? "the company"} goes back on the folio to be collected from the guest.${voidTarget.voucherNo ? " The company's receivable bill is cancelled and the next Night Audit posts the reversal." : ""}`
            : undefined
        }
        footer={
          <>
            <Button type="button" variant="outline" disabled={voidSaving} onClick={() => setVoidTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-rose-700 hover:bg-rose-800"
              disabled={voidSaving}
              onClick={() => void confirmVoid()}
            >
              {voidSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Voiding…
                </span>
              ) : (
                "Void bill"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {voidError ? <AlertBanner variant="error" message={voidError} onDismiss={() => setVoidError("")} /> : null}
          <FormField label="Reason" required>
            <TextAreaInput
              value={voidReason}
              maxLength={500}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Why is this bill being voided?"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
