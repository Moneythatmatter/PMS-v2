"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  CreditCard,
  Hash,
  IndianRupee,
  Plus,
  RefreshCw,
  User,
} from "lucide-react";
import { inHouseGuests, paymentRecords as initialPayments } from "@/app/data";
import type { PaymentRecord } from "@/app/data/frontoffice/modules";
import { paymentModes } from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  FOSearchToolbar,
  FormField,
  FOPageHeader,
  SelectInput,
  StatMiniCard,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

type PaymentType = PaymentRecord["type"];

const typeStyles: Record<PaymentType, string> = {
  Payment: "bg-emerald-50 text-emerald-700",
  Refund: "bg-red-50 text-red-700",
  Advance: "bg-blue-50 text-blue-700",
};

const statusStyles: Record<PaymentRecord["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Refunded: "bg-slate-100 text-slate-600",
};

export function PaymentsView() {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<PaymentRecord | null>(null);

  const [guestName, setGuestName] = useState(inHouseGuests[0].guestName);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [paymentType, setPaymentType] = useState<PaymentType>("Payment");
  const [txnRef, setTxnRef] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = payments.filter((p) => {
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesMode = modeFilter === "all" || p.mode === modeFilter;
      const matchesSearch =
        p.guestName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.transactionNo.toLowerCase().includes(q);
      return matchesType && matchesMode && matchesSearch;
    });
    if (sortBy === "amount-desc") rows = [...rows].sort((a, b) => b.amount - a.amount);
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guestName.localeCompare(b.guestName));
    return rows;
  }, [payments, search, typeFilter, modeFilter, sortBy]);

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "Completed");
    const collected = completed
      .filter((p) => p.type !== "Refund")
      .reduce((s, p) => s + p.amount, 0);
    const refunded = payments
      .filter((p) => p.type === "Refund")
      .reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending").length;
    return { collected, refunded, pending, total: payments.length };
  }, [payments]);

  const resetForm = () => {
    setGuestName(inHouseGuests[0].guestName);
    setAmount("");
    setMode("UPI");
    setPaymentType("Payment");
    setTxnRef("");
  };

  const openRecord = () => {
    resetForm();
    setRecordOpen(true);
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setToast("Please enter a valid amount.");
      return;
    }
    const guest = inHouseGuests.find((g) => g.guestName === guestName);
    const newPayment: PaymentRecord = {
      id: `P-${String(payments.length + 1).padStart(3, "0")}`,
      guestName,
      room: guest?.room,
      amount: parsed,
      mode,
      type: paymentType,
      transactionNo: txnRef || `TXN${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: paymentType === "Refund" ? "Refunded" : "Completed",
    };
    setPayments((prev) => [newPayment, ...prev]);
    setRecordOpen(false);
    resetForm();
    setToast(
      `${paymentType} of ${formatINR(parsed)} recorded for ${guestName}.`,
    );
  };

  const recordForm = (
    <div className="space-y-4">
      <FormField label="Guest" required>
        <SelectInput
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        >
          {inHouseGuests.map((g) => (
            <option key={g.id} value={g.guestName}>
              {g.guestName} — Room {g.room}
            </option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Transaction Type" required>
        <div className="flex rounded-xl bg-slate-100/80 p-1">
          {(["Payment", "Advance", "Refund"] as PaymentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPaymentType(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors sm:text-sm",
                paymentType === t
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Amount (₹)" required>
        <TextInput
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </FormField>

      <FormField label="Payment Mode" required>
        <SelectInput value={mode} onChange={(e) => setMode(e.target.value)}>
          {paymentModes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Transaction Reference">
        <TextInput
          placeholder="Optional — auto-generated if blank"
          value={txnRef}
          onChange={(e) => setTxnRef(e.target.value)}
        />
      </FormField>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Payments"
        description="Record payments, advances, and refunds. View transaction history."
        action={
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openRecord}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Collected Today"
          value={formatINR(stats.collected)}
          accent="#10b981"
          icon={IndianRupee}
          sublabel="Completed payments"
        />
        <StatMiniCard
          label="Refunds"
          value={formatINR(stats.refunded)}
          accent="#ef4444"
          icon={RefreshCw}
        />
        <StatMiniCard label="Pending" value={stats.pending} accent="#f59e0b" icon={Clock} />
        <StatMiniCard label="Transactions" value={stats.total} icon={Hash} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by guest, payment ID, or transaction no…"
        filterPills={{
          active: typeFilter,
          onChange: setTypeFilter,
          options: [
            { id: "all", label: "All" },
            { id: "Payment", label: "Payments" },
            { id: "Advance", label: "Advances" },
            { id: "Refund", label: "Refunds" },
          ],
        }}
        hasActiveAdvancedFilters={modeFilter !== "all" || sortBy !== "newest"}
        onClearAdvancedFilters={() => { setModeFilter("all"); setSortBy("newest"); }}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Payment Mode">
              <SelectInput value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                <option value="all">All modes</option>
                {paymentModes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="amount-desc">Amount: high to low</option>
                <option value="guest">Guest A–Z</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {filtered.length} of {payments.length} transactions
              </div>
            </FormField>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Payment History
          </h2>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setPreviewPayment(r)}
                className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{r.guestName}</p>
                    <p className="font-mono text-xs text-slate-400">{r.id}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      typeStyles[r.type],
                    )}
                  >
                    {r.type}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span
                    className={cn(
                      "font-semibold",
                      r.type === "Refund" ? "text-red-600" : "text-slate-900",
                    )}
                  >
                    {r.type === "Refund" ? "−" : ""}
                    {formatINR(r.amount)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      statusStyles[r.status],
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {r.mode} · {r.date}
                </p>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Payment ID</th>
                    <th className="pb-3 pr-4">Guest</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Mode</th>
                    <th className="pb-3 pr-4">Transaction No</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setPreviewPayment(r)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-blue-50/40"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs">{r.id}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div>
                          <p className="font-medium text-slate-900">{r.guestName}</p>
                          {r.room && (
                            <p className="text-xs text-slate-400">Room {r.room}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            typeStyles[r.type],
                          )}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            "font-semibold",
                            r.type === "Refund" ? "text-red-600" : "text-slate-900",
                          )}
                        >
                          {r.type === "Refund" ? "−" : ""}
                          {formatINR(r.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">{r.mode}</td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs text-slate-600">
                          {r.transactionNo}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            statusStyles[r.status],
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Record payment drawer */}
      <Drawer
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Record Payment"
        description="Collect payment, advance, or process a refund."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
              {paymentType === "Refund" ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Process Refund
                </>
              ) : (
                <>
                  <IndianRupee className="mr-1.5 h-4 w-4" />
                  Collect {paymentType}
                </>
              )}
            </Button>
          </>
        }
      >
        {recordForm}
      </Drawer>

      {/* Preview drawer */}
      <Drawer
        open={!!previewPayment}
        onClose={() => setPreviewPayment(null)}
        title={previewPayment?.id ?? ""}
        description={
          previewPayment
            ? `${previewPayment.type} · ${previewPayment.guestName}`
            : undefined
        }
        width="md"
        footer={
          previewPayment && (
            <>
              <Button variant="outline" onClick={() => setPreviewPayment(null)}>
                Close
              </Button>
              <Button variant="outline">
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Print Receipt
              </Button>
            </>
          )
        }
      >
        {previewPayment && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {previewPayment.type === "Refund" ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
              )}
              <div>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    previewPayment.type === "Refund"
                      ? "text-red-600"
                      : "text-slate-900",
                  )}
                >
                  {previewPayment.type === "Refund" ? "−" : ""}
                  {formatINR(previewPayment.amount)}
                </p>
                <div className="mt-1 flex gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      typeStyles[previewPayment.type],
                    )}
                  >
                    {previewPayment.type}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      statusStyles[previewPayment.status],
                    )}
                  >
                    {previewPayment.status}
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 text-sm">
              {[
                { icon: User, label: "Guest", value: previewPayment.guestName },
                {
                  icon: User,
                  label: "Room",
                  value: previewPayment.room ? `Room ${previewPayment.room}` : "—",
                },
                { icon: CreditCard, label: "Payment Mode", value: previewPayment.mode },
                {
                  icon: Hash,
                  label: "Transaction No",
                  value: previewPayment.transactionNo,
                },
                { icon: Calendar, label: "Date", value: previewPayment.date },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}
