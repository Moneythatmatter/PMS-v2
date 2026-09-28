"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Loader2,
  FileText,
  Receipt,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";
import {
  accPartyBillService,
  accVoucherService,
  type PartyBill,
  type Voucher,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  fyStartIso,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";

type VoucherKind = "Receipt" | "Payment";

interface FormLineItem {
  key: string;
  accountId: string;
  partyId: string;
  billId: string;
  amount: number;
  lineNarration: string;
}

type Toast = { message: string; variant: "success" | "error" } | null;

let lineSeq = 0;
const newLine = (): FormLineItem => ({
  key: `line-${++lineSeq}`,
  accountId: "",
  partyId: "",
  billId: "",
  amount: 0,
  lineNarration: "",
});

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const counterLedger = (v: Voucher) =>
  v.voucherCategory === "Receipt" ? v.creditAccounts : v.debitAccounts;

export function GLReceiptsPaymentsView() {
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();

  // Voucher Form State
  const [vouchType, setVouchType] = useState<VoucherKind>("Receipt");
  const [vouchDt, setVouchDt] = useState(todayIso());
  const [bankCashAccountId, setBankCashAccountId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [instrumentNo, setInstrumentNo] = useState("");
  const [instrumentDate, setInstrumentDate] = useState("");
  const [overallNarration, setOverallNarration] = useState("");
  const [lineItems, setLineItems] = useState<FormLineItem[]>(() => [newLine()]);
  const [preview, setPreview] = useState<{ key: string; voucherNo: string } | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);

  // Open bills per party (for settlement)
  const [billsByKey, setBillsByKey] = useState<Record<string, PartyBill[] | "loading">>({});

  // History filters
  const [historyFrom, setHistoryFrom] = useState(fyStartIso());
  const [historyTo, setHistoryTo] = useState(todayIso());
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"<ALL>" | VoucherKind>("<ALL>");

  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  const history = useAccQuery(
    () =>
      accVoucherService.list({
        category: historyTypeFilter === "<ALL>" ? "Receipt,Payment" : historyTypeFilter,
        from: historyFrom || undefined,
        to: historyTo || undefined,
        limit: 500,
      }),
    [historyTypeFilter, historyFrom, historyTo],
  );
  const today = useAccQuery(
    () => accVoucherService.list({ category: "Receipt,Payment", status: "Posted", from: todayIso(), to: todayIso() }),
    [],
  );

  const bankAccounts = useMemo(() => lookups?.bankCashAccounts ?? [], [lookups]);
  const bankId = bankCashAccountId || bankAccounts[0]?.id || "";
  const paymentMethod = lookups?.paymentMethods.find((m) => m.id === paymentMethodId);
  const voucherType = useMemo(() => {
    const code = vouchType === "Receipt" ? "RV" : "PV";
    const types = lookups?.voucherTypes ?? [];
    return types.find((t) => t.shortCode === code) ?? types.find((t) => t.category === vouchType);
  }, [lookups, vouchType]);
  const moduleType = vouchType === "Receipt" ? "AR" : "AP";

  // Server-side voucher number preview
  const previewKey = `${voucherType?.id}|${vouchDt}`;
  useEffect(() => {
    if (!voucherType?.id || !vouchDt || voucherType.numberingMethod === "Manual") return;
    let cancelled = false;
    const key = `${voucherType.id}|${vouchDt}`;
    accVoucherService
      .nextNumber(voucherType.id, vouchDt)
      .then((r) => {
        if (!cancelled) setPreview({ key, voucherNo: r.voucherNo });
      })
      .catch(() => {
        if (!cancelled) setPreview({ key, voucherNo: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [voucherType, vouchDt, previewNonce]);
  const vouchNo = !voucherType
    ? `No active ${vouchType} voucher type`
    : preview?.key === previewKey
    ? preview.voucherNo || "—"
    : "…";

  const totalVoucherAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [lineItems],
  );

  const loadBills = async (partyId: string, kind: VoucherKind) => {
    const key = `${kind}:${partyId}`;
    if (!partyId || billsByKey[key]) return;
    setBillsByKey((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const bills = await accPartyBillService.list({
        partyId,
        moduleType: kind === "Receipt" ? "AR" : "AP",
        pendingOnly: true,
      });
      setBillsByKey((prev) => ({ ...prev, [key]: bills }));
    } catch (e) {
      notify(accErrorMessage(e), "error");
      setBillsByKey((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };
  const billsFor = (partyId: string) => {
    const b = billsByKey[`${vouchType}:${partyId}`];
    return Array.isArray(b) ? b : [];
  };

  const handleTypeChange = (newType: VoucherKind) => {
    setVouchType(newType);
    setLineItems((prev) => prev.map((l) => ({ ...l, billId: "" })));
    for (const l of lineItems) if (l.partyId) void loadBills(l.partyId, newType);
  };

  const handleAddLineItem = () => setLineItems((prev) => [...prev, newLine()]);

  const handleRemoveLineItem = (key: string) => {
    if (lineItems.length === 1) {
      notify("At least one detail line item is required for voucher entry.", "error");
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleUpdateLineItem = <K extends keyof FormLineItem>(key: string, field: K, value: FormLineItem[K]) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const next: FormLineItem = { ...item, [field]: value };
        if (field === "partyId") {
          next.billId = "";
          const party = lookups?.parties.find((p) => p.id === value);
          const partyAccount = vouchType === "Receipt" ? party?.receivableAccountId : party?.payableAccountId;
          if (!item.accountId && partyAccount) next.accountId = partyAccount;
        }
        if (field === "billId" && value) {
          const bill = billsFor(item.partyId).find((b) => b.id === value);
          if (bill && !item.amount) next.amount = bill.balance;
        }
        return next;
      }),
    );
    if (field === "partyId" && value) void loadBills(value as string, vouchType);
  };

  const resetLines = () => setLineItems([newLine()]);

  const handlePostVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) {
      notify("Select the cash / bank account.", "error");
      return;
    }
    const missingIdx = lineItems.findIndex((l) => !l.accountId);
    if (missingIdx >= 0) {
      notify(`Line ${missingIdx + 1}: select an account ledger.`, "error");
      return;
    }
    const zeroIdx = lineItems.findIndex((l) => !(Number(l.amount) > 0));
    if (zeroIdx >= 0) {
      notify(`Line ${zeroIdx + 1}: enter an amount greater than zero.`, "error");
      return;
    }
    if (paymentMethod?.referenceRequired && !instrumentNo.trim()) {
      notify(`${paymentMethod.paymentMethodName} requires a reference / instrument number.`, "error");
      return;
    }
    const partyIds = [...new Set(lineItems.map((l) => l.partyId).filter(Boolean))];

    setIsPosting(true);
    try {
      const saved = await accVoucherService.receiptPayment({
        type: vouchType,
        voucherTypeId: voucherType?.id,
        voucherDate: vouchDt,
        bankCashAccountId: bankId,
        paymentMethodId: paymentMethodId || null,
        instrumentNo: instrumentNo.trim(),
        instrumentDate: instrumentDate || null,
        narration: overallNarration.trim(),
        partyId: partyIds.length === 1 ? partyIds[0] : null,
        status: "Posted",
        lines: lineItems.map((l) => ({
          accountId: l.accountId,
          partyId: l.partyId || null,
          amount: Number(l.amount),
          narration: l.lineNarration.trim(),
          billId: l.billId || null,
        })),
      });
      notify(`${vouchType} Voucher ${saved.voucherNo} for ${formatINR(saved.totalAmount)} posted successfully into General Ledger.`);
      resetLines();
      setInstrumentNo("");
      setInstrumentDate("");
      setOverallNarration("");
      setBillsByKey({});
      setPreviewNonce((n) => n + 1);
      void history.reload();
      void today.reload();
    } catch (err) {
      notify(accErrorMessage(err), "error");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    const list = history.data ?? [];
    if (!q) return list;
    return list.filter((item) =>
      [item.voucherNo, item.partyName, counterLedger(item), item.bankCashAccountName, item.instrumentNo, item.narration]
        .some((s) => (s ?? "").toLowerCase().includes(q)),
    );
  }, [history.data, historySearchQuery]);

  const todayReceiptsTotal = (today.data ?? [])
    .filter((v) => v.voucherCategory === "Receipt")
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const todayPaymentsTotal = (today.data ?? [])
    .filter((v) => v.voucherCategory === "Payment")
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const netCashFlow = todayReceiptsTotal - todayPaymentsTotal;

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return;
    }
    downloadCsv(
      `receipts-payments-${historyFrom}-to-${historyTo}.csv`,
      ["Voucher No", "Date", "Type", "Cash / Bank Account", "Party", "Ledger", "Mode", "Instrument No", "Amount", "Status", "Narration"],
      filteredHistory.map((v) => [
        v.voucherNo,
        v.voucherDate,
        v.voucherCategory,
        v.bankCashAccountName,
        v.partyName,
        counterLedger(v),
        v.paymentMethodName,
        v.instrumentNo,
        v.totalAmount,
        v.status,
        v.narration,
      ]),
    );
    notify(`Exported ${filteredHistory.length} vouchers to CSV.`);
  };

  const selectClass =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none";
  const lineSelectClass =
    "h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none";

  const renderBillSelect = (item: FormLineItem, className: string) => {
    const state = item.partyId ? billsByKey[`${vouchType}:${item.partyId}`] : undefined;
    const bills = billsFor(item.partyId);
    return (
      <select
        value={item.billId}
        disabled={!item.partyId || state === "loading"}
        onChange={(e) => handleUpdateLineItem(item.key, "billId", e.target.value)}
        className={className}
      >
        <option value="">
          {!item.partyId
            ? "Select a party first"
            : state === "loading"
            ? "Loading bills…"
            : bills.length === 0
            ? `No open ${moduleType} bills (on account)`
            : "On account (no bill)"}
        </option>
        {bills.map((b) => (
          <option key={b.id} value={b.id}>
            {b.billNo} · {formatDate(b.billDate)} · Bal {formatINR(b.balance)}
          </option>
        ))}
      </select>
    );
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Daily Cashier Transactions"
      title="GL Receipts / Payments Transaction"
      description="Post daily cashier collections, guest settlements, and vendor payments into General Ledger cash & bank accounts."
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {lookupsError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Could not load bank accounts, ledgers and parties: {lookupsError}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => void reloadLookups(true)} className="rounded-xl bg-white text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : lookupsLoading && !lookups ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading bank accounts, ledgers and parties…
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Today's Receipts Collected"
          value={today.loading && !today.data ? "…" : formatINR(todayReceiptsTotal)}
          sublabel="Posted cash/bank inflow vouchers today"
          accent="#16a34a"
          icon={TrendingUp}
        />
        <StatMiniCard
          label="Today's Payments Disbursed"
          value={today.loading && !today.data ? "…" : formatINR(todayPaymentsTotal)}
          sublabel="Posted vendor & utility disbursements today"
          accent="#e11d48"
          icon={TrendingDown}
        />
        <StatMiniCard
          label="Net Cash & Bank Flow"
          value={today.loading && !today.data ? "…" : `${netCashFlow >= 0 ? "+" : ""}${formatINR(netCashFlow)}`}
          sublabel="Net cash position change today"
          accent="#0284c7"
          icon={Wallet}
        />
      </div>

      {/* Voucher Posting Entry Form Card */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white text-xs shadow-2xs transition-all",
                vouchType === "Receipt" ? "bg-emerald-600" : "bg-rose-600",
              )}
            >
              {vouchType === "Receipt" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Post {vouchType} Voucher</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Enter cashier transaction header and sub-ledger allocation details.
              </p>
            </div>
          </div>

          {/* Transaction Type Segmented Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange("Receipt")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer select-none",
                vouchType === "Receipt" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              ✓ Receipt (Inflow)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("Payment")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer select-none",
                vouchType === "Payment" ? "bg-rose-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900",
              )}
            >
              ✓ Payment (Outflow)
            </button>
          </div>
        </div>

        {/* Voucher Header Form Controls Grid */}
        <form onSubmit={(e) => void handlePostVoucher(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70">
            <FormField label="Voucher No (Next)">
              <TextInput
                value={vouchNo}
                readOnly
                className="h-8 text-xs font-bold bg-white text-emerald-800 border-slate-200"
              />
            </FormField>

            <FormField label="Voucher Date" required>
              <FODatePicker value={vouchDt} onChange={(val) => setVouchDt(val)} />
            </FormField>

            <FormField label="Cash / Bank Account" required>
              <select value={bankId} onChange={(e) => setBankCashAccountId(e.target.value)} className={selectClass}>
                {bankAccounts.length === 0 && <option value="">No bank / cash accounts configured</option>}
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Payment Mode">
              <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className={selectClass}>
                <option value="">— Select mode —</option>
                {(lookups?.paymentMethods ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.paymentMethodName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ref / Instrument No" required={paymentMethod?.referenceRequired}>
              <TextInput
                value={instrumentNo}
                onChange={(e) => setInstrumentNo(e.target.value)}
                placeholder="Cheque #, UTR #, or EDC approval code..."
                className="h-8 text-xs bg-white"
              />
            </FormField>

            <FormField label="Instrument Date">
              <TextInput
                type="date"
                value={instrumentDate}
                onChange={(e) => setInstrumentDate(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </FormField>

            <FormField label="Overall Voucher Narration" className="sm:col-span-2">
              <TextInput
                value={overallNarration}
                onChange={(e) => setOverallNarration(e.target.value)}
                placeholder="Enter complete voucher description..."
                className="h-8 text-xs bg-white"
              />
            </FormField>
          </div>

          {/* Sub-Ledger Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                Voucher Allocation Breakdown ({lineItems.length} lines)
              </h3>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                className="rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Line Item
              </Button>
            </div>

            {/* Line Items Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2 w-10 text-center">#</th>
                    <th className="px-3 py-2 min-w-[180px]">Account Ledger</th>
                    <th className="px-3 py-2 min-w-[180px]">Party / Sub-Ledger</th>
                    <th className="px-3 py-2 min-w-[180px]">Against Bill</th>
                    <th className="px-3 py-2 w-32 text-right">Amount (₹)</th>
                    <th className="px-3 py-2 min-w-[200px]">Line Narration</th>
                    <th className="px-3 py-2 w-12 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lineItems.map((item, idx) => (
                    <tr key={item.key} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <select
                          value={item.accountId}
                          onChange={(e) => handleUpdateLineItem(item.key, "accountId", e.target.value)}
                          className={lineSelectClass}
                        >
                          <option value="">Select ledger…</option>
                          {(lookups?.ledgers ?? []).map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.code} - {l.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.partyId}
                          onChange={(e) => handleUpdateLineItem(item.key, "partyId", e.target.value)}
                          className={lineSelectClass}
                        >
                          <option value="">— No party —</option>
                          {(lookups?.parties ?? []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.partyName} ({p.partyCode})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">{renderBillSelect(item, lineSelectClass)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.amount || ""}
                          onChange={(e) => handleUpdateLineItem(item.key, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-7 w-full rounded-md border border-slate-200 px-2 text-right text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <TextInput
                          value={item.lineNarration}
                          onChange={(e) => handleUpdateLineItem(item.key, "lineNarration", e.target.value)}
                          placeholder="Line item description..."
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.key)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Line Items Stack */}
            <div className="md:hidden space-y-2">
              {lineItems.map((item, idx) => (
                <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-700">Line Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.key)}
                      className="text-rose-600 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Account Ledger:</label>
                      <select
                        value={item.accountId}
                        onChange={(e) => handleUpdateLineItem(item.key, "accountId", e.target.value)}
                        className={lineSelectClass}
                      >
                        <option value="">Select ledger…</option>
                        {(lookups?.ledgers ?? []).map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.code} - {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Party / Sub-Ledger:</label>
                      <select
                        value={item.partyId}
                        onChange={(e) => handleUpdateLineItem(item.key, "partyId", e.target.value)}
                        className={lineSelectClass}
                      >
                        <option value="">— No party —</option>
                        {(lookups?.parties ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.partyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Against Bill:</label>
                      {renderBillSelect(item, lineSelectClass)}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Amount (₹):</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.amount || ""}
                        onChange={(e) => handleUpdateLineItem(item.key, "amount", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-7 w-full rounded-md border border-slate-200 px-2 text-right text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Voucher Value Banner & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-emerald-900 font-semibold block">Total Voucher Value:</span>
                  <span className="text-lg font-black text-emerald-950">{formatINR(totalVoucherAmount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetLines}
                  className="rounded-xl text-xs font-semibold bg-white"
                >
                  Clear Form
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isPosting || !voucherType}
                  className={cn(
                    "rounded-xl font-bold text-xs px-4 shadow-sm text-white cursor-pointer disabled:opacity-75",
                    vouchType === "Receipt" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800",
                  )}
                >
                  {isPosting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Receipt className="h-3.5 w-3.5 mr-1" />}
                  Post {vouchType} Voucher
                </Button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Receipts & Payments History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Receipts &amp; Payments Log ({filteredHistory.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={historyFrom}
              onChange={(e) => setHistoryFrom(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              title="From date"
            />
            <input
              type="date"
              value={historyTo}
              onChange={(e) => setHistoryTo(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              title="To date"
            />

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              {(["<ALL>", "Receipt", "Payment"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHistoryTypeFilter(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer select-none",
                    historyTypeFilter === t ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search voucher # or party..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {history.error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <span>{history.error}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void history.reload()} className="rounded-xl bg-white text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          </div>
        ) : history.loading && !history.data ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading vouchers…
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-slate-400">
            No receipt or payment vouchers found for the selected filters.
          </div>
        ) : (
          <>
            {/* Desktop History Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-3.5 py-2.5">Voucher #</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-center">Type</th>
                    <th className="px-3.5 py-2.5">Cash / Bank Account</th>
                    <th className="px-3.5 py-2.5">Party / Ledger</th>
                    <th className="px-3 py-2.5">Mode</th>
                    <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.voucherNo}</td>
                      <td className="px-3 py-2.5 text-slate-600">{formatDate(row.voucherDate)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                            row.voucherCategory === "Receipt"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300",
                          )}
                        >
                          {row.voucherCategory}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">{row.bankCashAccountName ?? "—"}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {row.partyName ?? "General Account Posting"}
                        <span className="block text-[10px] text-slate-400 font-normal">{counterLedger(row)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {row.paymentMethodName ?? "—"}
                        {row.instrumentNo && <span className="block text-[10px] text-slate-400">{row.instrumentNo}</span>}
                      </td>
                      <td
                        className={cn(
                          "px-3.5 py-2.5 text-right font-bold text-xs",
                          row.voucherCategory === "Receipt" ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        {formatINR(row.totalAmount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile History Card List */}
            <div className="md:hidden space-y-2.5">
              {filteredHistory.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{row.voucherNo}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                        row.voucherCategory === "Receipt"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300",
                      )}
                    >
                      {row.voucherCategory}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{row.partyName ?? counterLedger(row)}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">
                      {formatDate(row.voucherDate)} • {row.paymentMethodName ?? "—"}
                    </span>
                    <span
                      className={cn("font-bold text-xs", row.voucherCategory === "Receipt" ? "text-emerald-700" : "text-rose-700")}
                    >
                      {formatINR(row.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </ModulePageShell>
  );
}
