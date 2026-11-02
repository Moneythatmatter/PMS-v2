"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Percent, RefreshCw, Send, Undo2, UtensilsCrossed, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FODatePicker, StatMiniCard } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import { accFbPostingService } from "@/services/accounts";
import { accErrorMessage, formatDate, formatINR, todayIso, useAccQuery } from "@/components/accounts/accountsApi";
import { FbOutletPostingRulesPanel } from "@/components/accounts/FbOutletPostingRulesPanel";

type Toast = { message: string; variant: "success" | "error" } | null;

export function FnbPostingView() {
  const [date, setDate] = useState(todayIso());
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const preview = useAccQuery(() => accFbPostingService.preview(date), [date]);
  const history = useAccQuery(() => accFbPostingService.history(), []);
  const data = preview.data;

  const post = async () => {
    if (!data?.canPost) return;
    if (!window.confirm(`Create the F&B voucher for ${formatDate(date)} (${data.postingStatus})?`)) return;
    setPosting(true);
    try {
      const res = await accFbPostingService.post(date);
      setToast({
        message: res.voucher
          ? `Voucher ${res.voucher.voucherNo} created (${res.voucher.status}).`
          : "Nothing left to post for this date.",
        variant: "success",
      });
      await Promise.all([preview.reload(), history.reload()]);
    } catch (e) {
      setToast({ message: accErrorMessage(e), variant: "error" });
      await preview.reload();
    } finally {
      setPosting(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & F&B"
      title="F&B Posting"
      description="Restaurant, bar and room-service bills settled at the POS — one Journal Voucher per business date, with sales, tax and collections split by outlet and its division. Bills charged to a room are posted by Front Office Posting. Night Audit does this automatically."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "F&B Posting" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <FODatePicker value={date} onChange={setDate} className="w-40" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void preview.reload()}
            disabled={preview.loading}
            className="rounded-xl bg-white text-xs font-medium shadow-xs"
          >
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5 text-slate-500", preview.loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void post()}
            disabled={!data?.canPost || posting}
            className="rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
          >
            {posting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
            Post to Accounts
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {preview.loading && !data ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Building preview…
          </div>
        ) : preview.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{preview.error}</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatMiniCard
                label="F&B Sales"
                value={formatINR(data.totals.sales + data.totals.tax)}
                sublabel={`${data.counts.bills} bill(s) · tax ${formatINR(data.totals.tax)}`}
                accent="#ea580c"
                icon={UtensilsCrossed}
              />
              <StatMiniCard
                label="Discounts"
                value={formatINR(data.totals.discount)}
                sublabel="Taken off income"
                accent="#8b5cf6"
                icon={Percent}
              />
              <StatMiniCard
                label="Collections"
                value={formatINR(data.totals.collections)}
                sublabel={`${data.counts.payments} payment(s)`}
                accent="#16a34a"
                icon={Wallet}
              />
              <StatMiniCard
                label="Voided After Posting"
                value={formatINR(data.totals.voided)}
                sublabel={`${data.counts.voided} payment(s) posted back`}
                accent="#e11d48"
                icon={Undo2}
              />
              <StatMiniCard
                label="Voucher"
                value={formatINR(data.totals.debit)}
                sublabel={`Will be created as ${data.postingStatus}`}
                accent={data.totals.debit === data.totals.credit ? "#16a34a" : "#e11d48"}
                icon={CheckCircle2}
              />
            </div>

            {data.issues.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="h-4 w-4" /> Fix these in Accounts before posting
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {data.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}

            {(data.warnings ?? []).length > 0 && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
                <p className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="h-4 w-4" /> Will post, but check these
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {data.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {(data.byOutlet ?? []).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">By outlet</h3>
                <table className="w-full text-left text-[11px]">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-1.5">Outlet</th>
                      <th className="py-1.5">Division</th>
                      <th className="py-1.5 text-right">Bills</th>
                      <th className="py-1.5 text-right">Sales (net)</th>
                      <th className="py-1.5 text-right">Tax</th>
                      <th className="py-1.5 text-right">Discount</th>
                      <th className="py-1.5 text-right">Collections</th>
                      <th className="py-1.5 text-right">Voided</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.byOutlet.map((o) => (
                      <tr key={o.outletId ?? "none"}>
                        <td className="py-1.5 font-semibold text-slate-800">{o.outletName}</td>
                        <td className={cn("py-1.5", o.divisionName ? "text-slate-600" : "text-amber-700")}>
                          {o.divisionName ?? "Not mapped"}
                        </td>
                        <td className="py-1.5 text-right font-mono">{o.bills}</td>
                        <td className="py-1.5 text-right font-mono">{formatINR(o.sales)}</td>
                        <td className="py-1.5 text-right font-mono">{formatINR(o.tax)}</td>
                        <td className="py-1.5 text-right font-mono">{formatINR(o.discount)}</td>
                        <td className="py-1.5 text-right font-mono">{formatINR(o.collections)}</td>
                        <td className="py-1.5 text-right font-mono">{o.voided ? formatINR(o.voided) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.startDate ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                Posting starts from {formatDate(data.startDate)} (Company Settings).
                {data.counts.beforeStart > 0 && ` ${data.counts.beforeStart} older bill(s) are left out.`}
              </p>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                No posting start date is set, so every settled POS bill so far is included. If your opening balances
                already cover older sales, set &quot;Front Office posting starts from&quot; in Company Settings first — it
                applies to F&amp;B too.
              </p>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                Voucher lines — business date {formatDate(data.businessDate)}
              </h3>
              {data.lines.length === 0 ? (
                <p className="py-6 text-center text-slate-500">Nothing unposted up to this date.</p>
              ) : (
                <table className="w-full text-left text-[11px]">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-1.5">Ledger</th>
                      <th className="py-1.5">Division</th>
                      <th className="py-1.5">Narration</th>
                      <th className="py-1.5 text-right">Debit</th>
                      <th className="py-1.5 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.lines.map((l, i) => (
                      <tr key={`${l.accountId}-${l.entryType}-${i}`}>
                        <td className="py-1.5 font-semibold text-slate-800">
                          <span className="font-mono text-slate-500">{l.accountCode ?? "—"}</span> {l.accountName ?? "Missing ledger"}
                        </td>
                        <td className="py-1.5 text-slate-600">{l.divisionName ?? "—"}</td>
                        <td className="py-1.5 text-slate-600">{l.narration}</td>
                        <td className="py-1.5 text-right font-mono">{l.entryType === "Dr" ? formatINR(l.amount) : ""}</td>
                        <td className="py-1.5 text-right font-mono">{l.entryType === "Cr" ? formatINR(l.amount) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-300 font-bold">
                    <tr>
                      <td className="py-1.5" colSpan={3}>
                        Total
                      </td>
                      <td className="py-1.5 text-right font-mono">{formatINR(data.totals.debit)}</td>
                      <td className="py-1.5 text-right font-mono">{formatINR(data.totals.credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        ) : null}

        <FbOutletPostingRulesPanel
          onChanged={() => void preview.reload()}
          onMessage={(message, variant) => setToast({ message, variant })}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">F&amp;B vouchers</h3>
          {history.loading ? (
            <div className="flex items-center gap-2 py-4 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : history.error ? (
            <p className="text-rose-700">{history.error}</p>
          ) : !history.data?.length ? (
            <p className="py-4 text-center text-slate-500">No F&amp;B vouchers yet.</p>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-1.5">Voucher</th>
                  <th className="py-1.5">Business date</th>
                  <th className="py-1.5">Created by</th>
                  <th className="py-1.5">Status</th>
                  <th className="py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.data.map((v) => (
                  <tr key={v.id}>
                    <td className="py-1.5 font-mono font-semibold text-slate-800">{v.voucherNo}</td>
                    <td className="py-1.5">{formatDate(v.businessDate ?? v.voucherDate)}</td>
                    <td className="py-1.5">{v.sourceType === "NIGHT_AUDIT" ? "Night Audit" : "Manual"}</td>
                    <td className="py-1.5">{v.status}</td>
                    <td className="py-1.5 text-right font-mono">{formatINR(v.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ModulePageShell>
  );
}
