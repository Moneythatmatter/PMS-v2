"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Printer,
  Plus,
  Trash2,
  Search,
  Loader2,
  FileText,
  Receipt,
  AlertCircle,
  RefreshCw,
  X,
  ArrowDownLeft,
  ArrowUpRight,
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
import { downloadXlsx } from "@/lib/xlsx";
import { ExportMenu } from "@/components/accounts/ExportMenu";
import { VoucherEditModal } from "@/components/accounts/VoucherEditModal";
import { DataGrid } from "@/components/accounts/DataGrid";
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
  billId: string;
  amount: number;
}

type Toast = { message: string; variant: "success" | "error" } | null;

let lineSeq = 0;
const newLine = (accountId = ""): FormLineItem => ({
  key: `line-${++lineSeq}`,
  accountId,
  billId: "",
  amount: 0,
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

const EXPORT_HEADER = [
  "Voucher No",
  "Date",
  "Type",
  "Cash / Bank Account",
  "Party",
  "Ledger",
  "Mode",
  "Instrument No",
  "Amount",
  "Status",
  "Narration",
];

export function GLReceiptsPaymentsView() {
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const [formOpen, setFormOpen] = useState(false);
  const [editVoucherId, setEditVoucherId] = useState<string | null>(null);

  // Voucher Form State
  const [vouchType, setVouchType] = useState<VoucherKind>("Receipt");
  const [vouchDt, setVouchDt] = useState(todayIso());
  const [bankCashAccountId, setBankCashAccountId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [instrumentNo, setInstrumentNo] = useState("");
  const [instrumentDate, setInstrumentDate] = useState("");
  const [overallNarration, setOverallNarration] = useState("");
  const [partyId, setPartyId] = useState("");
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

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPosting) setFormOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen, isPosting]);

  const totalVoucherAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [lineItems],
  );

  const loadBills = async (forPartyId: string, kind: VoucherKind) => {
    const key = `${kind}:${forPartyId}`;
    if (!forPartyId || billsByKey[key]) return;
    setBillsByKey((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const bills = await accPartyBillService.list({
        partyId: forPartyId,
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
  const partyBillState = partyId ? billsByKey[`${vouchType}:${partyId}`] : undefined;
  const partyBills = Array.isArray(partyBillState) ? partyBillState : [];

  const partyAccountFor = (id: string, kind: VoucherKind) => {
    const party = lookups?.parties.find((p) => p.id === id);
    return (kind === "Receipt" ? party?.receivableAccountId : party?.payableAccountId) ?? "";
  };

  const handleTypeChange = (newType: VoucherKind) => {
    if (newType === vouchType) return;
    setVouchType(newType);
    setLineItems((prev) => prev.map((l) => ({ ...l, billId: "" })));
    if (partyId) void loadBills(partyId, newType);
  };

  const openForm = (kind: VoucherKind) => {
    handleTypeChange(kind);
    setFormOpen(true);
  };

  const handlePartyChange = (id: string) => {
    const prevAccount = partyAccountFor(partyId, vouchType);
    const nextAccount = id ? partyAccountFor(id, vouchType) : "";
    setPartyId(id);
    setLineItems((prev) =>
      prev.map((l) => ({
        ...l,
        billId: "",
        accountId: nextAccount && (!l.accountId || l.accountId === prevAccount) ? nextAccount : l.accountId,
      })),
    );
    if (id) void loadBills(id, vouchType);
  };

  const handleAddLineItem = () => setLineItems((prev) => [...prev, newLine(partyAccountFor(partyId, vouchType))]);

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
        if (field === "billId" && value) {
          const bill = partyBills.find((b) => b.id === value);
          if (bill && !item.amount) next.amount = bill.balance;
        }
        return next;
      }),
    );
  };

  const resetLines = () => {
    setPartyId("");
    setLineItems([newLine()]);
  };

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
    if (voucherType?.partyRequired && !partyId) {
      notify(`${voucherType.voucherTypeName} requires a party.`, "error");
      return;
    }

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
        partyId: partyId || null,
        status: "Posted",
        lines: lineItems.map((l) => ({
          accountId: l.accountId,
          amount: Number(l.amount),
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
      setFormOpen(false);
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

  const filteredReceipts = filteredHistory
    .filter((v) => v.voucherCategory === "Receipt")
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const filteredPayments = filteredHistory
    .filter((v) => v.voucherCategory === "Payment")
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const todayVouchers = today.data ?? [];
  const todayReceipts = todayVouchers.filter((v) => v.voucherCategory === "Receipt");
  const todayPayments = todayVouchers.filter((v) => v.voucherCategory === "Payment");
  const todayReceiptsTotal = todayReceipts.reduce((sum, v) => sum + v.totalAmount, 0);
  const todayPaymentsTotal = todayPayments.reduce((sum, v) => sum + v.totalAmount, 0);
  const netCashFlow = todayReceiptsTotal - todayPaymentsTotal;

  const exportRows = () =>
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
    ]);

  const ensureExportable = () => {
    if (filteredHistory.length === 0) {
      notify("Nothing to export for the selected filters.", "error");
      return false;
    }
    return true;
  };

  const handleExportCsv = () => {
    if (!ensureExportable()) return;
    downloadCsv(`receipts-payments-${historyFrom}-to-${historyTo}.csv`, EXPORT_HEADER, exportRows());
    notify(`Exported ${filteredHistory.length} vouchers to CSV.`);
  };

  const handleExportExcel = () => {
    if (!ensureExportable()) return;
    downloadXlsx(`receipts-payments-${historyFrom}-to-${historyTo}.xlsx`, [
      {
        name: "Receipts & Payments",
        title: "GL Receipts / Payments Register",
        meta: [
          ["Period", `${formatDate(historyFrom)} to ${formatDate(historyTo)}`],
          ["Type", historyTypeFilter === "<ALL>" ? "Receipts & Payments" : historyTypeFilter],
          ...(historySearchQuery.trim() ? [["Search", historySearchQuery.trim()] as [string, string]] : []),
          ["Total Receipts", filteredReceipts],
          ["Total Payments", filteredPayments],
          ["Net", filteredReceipts - filteredPayments],
          ["Generated", new Date().toLocaleString("en-IN")],
        ],
        header: EXPORT_HEADER,
        rows: exportRows().map((r) => [r[0], formatDate(String(r[1] ?? "")), ...r.slice(2)]),
      },
    ]);
    notify(`Exported ${filteredHistory.length} vouchers to Excel.`);
  };

  const isReceipt = vouchType === "Receipt";
  const selectClass =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none";
  const lineSelectClass =
    "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none";

  const renderBillSelect = (item: FormLineItem, className: string) => {
    return (
      <select
        value={item.billId}
        disabled={!partyId || partyBillState === "loading"}
        onChange={(e) => handleUpdateLineItem(item.key, "billId", e.target.value)}
        className={className}
      >
        <option value="">
          {!partyId
            ? "Select a party first"
            : partyBillState === "loading"
            ? "Loading bills…"
            : partyBills.length === 0
            ? `No open ${moduleType} bills (on account)`
            : "On account (no bill)"}
        </option>
        {partyBills.map((b) => (
          <option key={b.id} value={b.id}>
            {b.billNo} · {formatDate(b.billDate)} · Bal {formatINR(b.balance)}
          </option>
        ))}
      </select>
    );
  };

  const ledgerOptions = (
    <>
      <option value="">Select ledger…</option>
      {(lookups?.ledgers ?? []).map((l) => (
        <option key={l.id} value={l.id}>
          {l.code} - {l.name}
        </option>
      ))}
    </>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Daily Cashier Transactions"
      title="GL Receipts / Payments Transaction"
      description="Post daily cashier collections, guest settlements, and vendor payments into General Ledger cash & bank accounts."
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-lg text-xs font-semibold bg-white border-slate-200 text-slate-700 shadow-2xs hidden sm:inline-flex"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>
          <ExportMenu
            onExcel={handleExportExcel}
            onCsv={handleExportCsv}
            disabled={filteredHistory.length === 0}
            excelHint="Register with totals"
            csvHint="Plain voucher rows"
            tone="light"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => openForm(vouchType)}
            disabled={!lookups}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs px-3.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Voucher
          </Button>
        </div>
      }
      wrapChildren={false}
    >
      <div className="mt-4" />
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
          label="Today's Receipts"
          value={today.loading && !today.data ? "…" : formatINR(todayReceiptsTotal)}
          sublabel={`${todayReceipts.length} posted inflow voucher${todayReceipts.length !== 1 ? "s" : ""}`}
          accent="#16a34a"
          icon={TrendingUp}
        />
        <StatMiniCard
          label="Today's Payments"
          value={today.loading && !today.data ? "…" : formatINR(todayPaymentsTotal)}
          sublabel={`${todayPayments.length} posted outflow voucher${todayPayments.length !== 1 ? "s" : ""}`}
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

      {/* Filters: search left, period & type right */}
      <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder="Search voucher #, party, ledger…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <FODatePicker value={historyFrom} onChange={setHistoryFrom} className="w-36" />
            <span className="text-xs font-medium text-slate-400">to</span>
            <FODatePicker value={historyTo} onChange={setHistoryTo} className="w-36" />
          </div>
          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            {(["<ALL>", "Receipt", "Payment"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setHistoryTypeFilter(t)}
                className={cn(
                  "h-full rounded-md px-3 transition-colors cursor-pointer select-none",
                  historyTypeFilter === t
                    ? t === "Payment"
                      ? "bg-rose-600 text-white"
                      : t === "Receipt"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {t === "<ALL>" ? "All" : `${t}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts & Payments Register */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Receipt className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Receipts &amp; Payments Register</h2>
              <p className="text-[11px] text-slate-500">
                {filteredHistory.length} voucher{filteredHistory.length !== 1 ? "s" : ""} ·{" "}
                {formatDate(historyFrom)} – {formatDate(historyTo)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800">
              <ArrowDownLeft className="h-3.5 w-3.5" /> In {formatINR(filteredReceipts)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-800">
              <ArrowUpRight className="h-3.5 w-3.5" /> Out {formatINR(filteredPayments)}
            </span>
          </div>
        </div>

        <div>
          {history.error ? (
            <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <span>{history.error}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void history.reload()} className="rounded-xl bg-white text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
              </Button>
            </div>
          ) : history.loading && !history.data ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs font-medium text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading vouchers…
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Receipt className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-slate-700">No vouchers for these filters</p>
              <p className="text-xs text-slate-500">Change the dates or post a new receipt / payment.</p>
              <Button
                type="button"
                size="sm"
                onClick={() => openForm(vouchType)}
                disabled={!lookups}
                className="mt-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Voucher
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Register Table */}
              <div className="hidden md:block">
                <DataGrid
                  rows={filteredHistory}
                  rowKey={(row) => row.id}
                  onRowClick={(row) => setEditVoucherId(row.id)}
                  columns={[
                    {
                      id: "voucherNo",
                      label: "Voucher No",
                      width: 140,
                      cell: (row) => row.voucherNo,
                      cellClass: () => "font-semibold text-slate-900",
                      footer: `Total (${filteredHistory.length})`,
                    },
                    { id: "date", label: "Date", width: 110, cell: (row) => formatDate(row.voucherDate) },
                    {
                      id: "type",
                      label: "Type",
                      width: 90,
                      cell: (row) => row.voucherCategory,
                      cellClass: (row) => (row.voucherCategory === "Receipt" ? "text-emerald-700" : "text-rose-700"),
                    },
                    {
                      id: "bank",
                      label: "Cash / Bank",
                      width: 200,
                      cell: (row) => row.bankCashAccountName ?? "",
                      title: (row) => row.bankCashAccountName ?? undefined,
                    },
                    {
                      id: "party",
                      label: "Party",
                      width: 170,
                      cell: (row) => row.partyName ?? "",
                      title: (row) => row.partyName ?? undefined,
                    },
                    {
                      id: "ledger",
                      label: "Ledger",
                      width: 220,
                      cell: (row) => counterLedger(row),
                      cellClass: () => "text-slate-600",
                      title: (row) => counterLedger(row) ?? undefined,
                    },
                    { id: "mode", label: "Mode", width: 130, cell: (row) => row.paymentMethodName ?? "" },
                    {
                      id: "instrument",
                      label: "Instrument No",
                      width: 140,
                      cell: (row) => row.instrumentNo ?? "",
                      cellClass: () => "text-slate-600",
                      title: (row) => row.instrumentNo ?? undefined,
                    },
                    {
                      id: "receipt",
                      label: "Receipt (₹)",
                      width: 130,
                      align: "right",
                      cell: (row) => (row.voucherCategory === "Receipt" ? formatINR(row.totalAmount) : ""),
                      cellClass: () => "tabular-nums text-emerald-700",
                      footer: <span className="tabular-nums text-emerald-800">{formatINR(filteredReceipts)}</span>,
                    },
                    {
                      id: "payment",
                      label: "Payment (₹)",
                      width: 130,
                      align: "right",
                      cell: (row) => (row.voucherCategory === "Payment" ? formatINR(row.totalAmount) : ""),
                      cellClass: () => "tabular-nums text-rose-700",
                      footer: <span className="tabular-nums text-rose-800">{formatINR(filteredPayments)}</span>,
                    },
                    { id: "status", label: "Status", width: 90, cell: (row) => row.status },
                  ]}
                />
              </div>

              {/* Mobile Register Cards */}
              <div className="md:hidden space-y-2.5 p-3">
                {filteredHistory.map((row) => {
                  const receipt = row.voucherCategory === "Receipt";
                  return (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditVoucherId(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setEditVoucherId(row.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border border-slate-200 border-l-4 bg-white p-3 space-y-1.5 active:bg-slate-50",
                        receipt ? "border-l-emerald-500" : "border-l-rose-500",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{row.voucherNo}</span>
                        <TypeBadge receipt={receipt} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{row.partyName ?? counterLedger(row)}</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">
                          {formatDate(row.voucherDate)} • {row.paymentMethodName ?? "—"}
                        </span>
                        <span className={cn("font-bold tabular-nums", receipt ? "text-emerald-700" : "text-rose-700")}>
                          {formatINR(row.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {editVoucherId && (
        <VoucherEditModal
          voucherId={editVoucherId}
          onClose={() => setEditVoucherId(null)}
          onChanged={() => {
            void history.reload();
            void today.reload();
          }}
        />
      )}

      {/* Create Voucher Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => !isPosting && setFormOpen(false)}
            aria-label="Close voucher form"
          />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-form-title"
            onSubmit={(e) => void handlePostVoucher(e)}
            className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            {/* Modal Header */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-white",
                isReceipt ? "bg-emerald-700" : "bg-rose-700",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  {isReceipt ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </span>
                <div>
                  <h2 id="voucher-form-title" className="text-base font-bold">
                    New {vouchType} Voucher
                  </h2>
                  <p className="text-[11px] text-white/80">
                    Voucher No <span className="font-semibold text-white">{vouchNo}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-lg bg-black/15 p-0.5">
                  {(["Receipt", "Payment"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleTypeChange(k)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-bold transition-colors cursor-pointer select-none",
                        vouchType === k ? "bg-white text-slate-900" : "text-white/85 hover:text-white",
                      )}
                    >
                      {k === "Receipt" ? "Receipt (In)" : "Payment (Out)"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={isPosting}
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

                <FormField label="Party / Sub-Ledger" required={voucherType?.partyRequired}>
                  <select value={partyId} onChange={(e) => handlePartyChange(e.target.value)} className={selectClass}>
                    <option value="">— No party (direct {vouchType.toLowerCase()}) —</option>
                    {(lookups?.parties ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partyName} ({p.partyCode})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ref / Instrument No" required={paymentMethod?.referenceRequired}>
                  <TextInput
                    value={instrumentNo}
                    onChange={(e) => setInstrumentNo(e.target.value)}
                    placeholder="Cheque #, UTR # or EDC code"
                    className="h-9 text-xs bg-white"
                  />
                </FormField>

                <FormField label="Instrument Date">
                  <TextInput
                    type="date"
                    value={instrumentDate}
                    onChange={(e) => setInstrumentDate(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                </FormField>

                <FormField label="Narration" className="sm:col-span-2">
                  <TextInput
                    value={overallNarration}
                    onChange={(e) => setOverallNarration(e.target.value)}
                    placeholder="Describe this voucher…"
                    className="h-9 text-xs bg-white"
                  />
                </FormField>
              </div>

              {/* Allocation Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    Allocation ({lineItems.length} line{lineItems.length !== 1 ? "s" : ""})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="rounded-lg text-xs font-semibold bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Line
                  </Button>
                </div>

                {/* Desktop Lines */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="px-3 py-2 w-10 text-center">#</th>
                        <th className="px-3 py-2 min-w-[220px]">Account Ledger</th>
                        <th className="px-3 py-2 min-w-[220px]">Against Bill</th>
                        <th className="px-3 py-2 w-40 text-right">Amount (₹)</th>
                        <th className="px-3 py-2 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lineItems.map((item, idx) => (
                        <tr key={item.key}>
                          <td className="px-3 py-2 text-center text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <select
                              value={item.accountId}
                              onChange={(e) => handleUpdateLineItem(item.key, "accountId", e.target.value)}
                              className={lineSelectClass}
                            >
                              {ledgerOptions}
                            </select>
                          </td>
                          <td className="px-3 py-2">{renderBillSelect(item, lineSelectClass)}</td>
                          <td className="px-3 py-2">
                            <AmountInput
                              value={item.amount}
                              onChange={(v) => handleUpdateLineItem(item.key, "amount", v)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.key)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Remove line ${idx + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Lines */}
                <div className="md:hidden space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-xs font-bold text-slate-700">Line {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.key)}
                          className="flex items-center gap-1 text-xs font-bold text-rose-600"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                      <FormField label="Account Ledger">
                        <select
                          value={item.accountId}
                          onChange={(e) => handleUpdateLineItem(item.key, "accountId", e.target.value)}
                          className={lineSelectClass}
                        >
                          {ledgerOptions}
                        </select>
                      </FormField>
                      <FormField label="Against Bill">{renderBillSelect(item, lineSelectClass)}</FormField>
                      <FormField label="Amount (₹)">
                        <AmountInput value={item.amount} onChange={(v) => handleUpdateLineItem(item.key, "amount", v)} />
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total {vouchType}</p>
                <p className={cn("text-xl font-bold tabular-nums", isReceipt ? "text-emerald-700" : "text-rose-700")}>
                  {formatINR(totalVoucherAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetLines}
                  disabled={isPosting}
                  className="rounded-lg text-xs font-semibold bg-white"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormOpen(false)}
                  disabled={isPosting}
                  className="rounded-lg text-xs font-semibold bg-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPosting || !voucherType}
                  className={cn(
                    "rounded-lg font-bold text-xs px-4 shadow-sm text-white disabled:opacity-75",
                    isReceipt ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800",
                  )}
                >
                  {isPosting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Receipt className="h-3.5 w-3.5 mr-1" />}
                  Post {vouchType}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </ModulePageShell>
  );
}

function TypeBadge({ receipt }: { receipt: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        receipt ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
      )}
    >
      {receipt ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
      {receipt ? "Receipt" : "Payment"}
    </span>
  );
}

function AmountInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={value || ""}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder="0.00"
      className="h-8 w-full rounded-md border border-slate-200 px-2 text-right text-xs font-bold tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none"
    />
  );
}
