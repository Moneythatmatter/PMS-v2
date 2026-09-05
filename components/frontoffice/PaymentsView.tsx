"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  CreditCard,
  Hash,
  IndianRupee,
  Plus,
  Printer,
  RefreshCw,
  User,
} from "lucide-react";
import type { InHouseGuest } from "@/app/data/frontoffice/modules";
import {
  paymentModes,
  reservationPaymentModesNeedingExternalRef,
} from "@/app/data/frontoffice/constants";
import {
  billingFolioService,
  billingTransactionService,
} from "@/services/front-office";
import { reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  EmptyState,
  FOSearchToolbar,
  FormField,
  FOPageHeader,
  SelectInput,
  StatMiniCard,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import {
  type FrontOfficePaymentRow,
  type FrontOfficePaymentType,
  mapFrontOfficeTransactions,
  printFrontOfficePaymentReceipt,
} from "@/components/frontoffice/paymentUtils";
import { cn } from "@/lib/utils";

const typeStyles: Record<FrontOfficePaymentType, string> = {
  Payment: "bg-emerald-50 text-emerald-700",
  Refund: "bg-red-50 text-red-700",
  Advance: "bg-emerald-50 text-emerald-800",
};

const statusStyles: Record<FrontOfficePaymentRow["status"], string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Refunded: "bg-slate-100 text-slate-600",
};

function isToday(value: string): boolean {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === new Date().toDateString();
}

export function PaymentsView() {
  const [payments, setPayments] = useState<FrontOfficePaymentRow[]>([]);
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );
  const [recordOpen, setRecordOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<FrontOfficePaymentRow | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [paymentType, setPaymentType] = useState<FrontOfficePaymentType>("Payment");
  const [txnRef, setTxnRef] = useState("");

  const loadPayments = useCallback(async () => {
    const [transactions, folios, inHouse] = await Promise.all([
      billingTransactionService.list(),
      billingFolioService.list(),
      reservationService.inHouse(),
    ]);
    setPayments(mapFrontOfficeTransactions(transactions, folios));
    setGuests(inHouse as InHouseGuest[]);
    return { transactions, folios, inHouse };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { inHouse } = await loadPayments();
        if (!cancelled) {
          if (inHouse.length > 0) setGuestName(inHouse[0].guestName);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load payments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPayments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = payments.filter((p) => {
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesMode = modeFilter === "all" || p.mode === modeFilter;
      const haystack = [
        p.guestName,
        p.transactionNumber,
        p.externalReference,
        p.room,
        p.bookingNo,
        p.bookingId,
        p.folioNumber,
        p.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesType && matchesMode && matchesSearch;
    });

    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "amount-desc":
          return b.amount - a.amount;
        case "guest":
          return a.guestName.localeCompare(b.guestName);
        case "newest":
        default:
          return (
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime()
          );
      }
    });

    return rows;
  }, [payments, search, typeFilter, modeFilter, sortBy]);

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "Completed");
    const collectedToday = completed
      .filter((p) => p.type !== "Refund" && isToday(p.transactionDate))
      .reduce((s, p) => s + p.amount, 0);
    const refunded = payments
      .filter((p) => p.type === "Refund")
      .reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending").length;
    return { collectedToday, refunded, pending, total: payments.length };
  }, [payments]);

  const resetForm = () => {
    setGuestName(guests[0]?.guestName ?? "");
    setAmount("");
    setMode("UPI");
    setPaymentType("Payment");
    setTxnRef("");
  };

  const openRecord = () => {
    resetForm();
    setRecordOpen(true);
  };

  const handlePrintReceipt = (payment: FrontOfficePaymentRow) => {
    const opened = printFrontOfficePaymentReceipt(payment);
    if (!opened) {
      setToast({
        message: "Unable to open print window. Allow pop-ups and try again.",
        variant: "error",
      });
      return;
    }
    setToast({
      message: `Printing receipt for ${payment.transactionNumber}.`,
      variant: "success",
    });
  };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setToast({ message: "Please enter a valid amount.", variant: "error" });
      return;
    }

    const guest = guests.find((g) => g.guestName === guestName);
    if (!guest) {
      setToast({ message: "Select a guest to record payment.", variant: "error" });
      return;
    }

    if (paymentType === "Refund") {
      setToast({
        message: "Refunds are not available yet. Process from Guest Folio.",
        variant: "error",
      });
      return;
    }

    if (
      reservationPaymentModesNeedingExternalRef.has(mode) &&
      !txnRef.trim()
    ) {
      setToast({
        message:
          mode === "UPI"
            ? "Enter UPI transaction ID from your payment app."
            : "Enter card auth / reference from POS or bank.",
        variant: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: parsed,
        paymentMethod: mode,
        bookingId: guest.id,
        externalReference: txnRef.trim() || null,
      };

      if (paymentType === "Advance") {
        await billingTransactionService.recordReservationAdvance({
          ...payload,
          bookingId: guest.id,
        });
      } else {
        await billingTransactionService.recordFrontOfficePayment(payload);
      }

      await loadPayments();
      setRecordOpen(false);
      resetForm();
      setToast({
        message: `${paymentType} of ${formatINR(parsed)} recorded for ${guestName}.`,
        variant: "success",
      });
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Failed to record payment",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const recordForm = (
    <div className="space-y-4">
      <FormField label="Guest" required>
        <SelectInput
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        >
          {guests.length === 0 ? (
            <option value="">No in-house guests</option>
          ) : (
            guests.map((g) => (
              <option key={g.id} value={g.guestName}>
                {g.guestName} — Room {g.room}
              </option>
            ))
          )}
        </SelectInput>
      </FormField>

      <FormField label="Transaction Type" required>
        <div className="flex rounded-xl bg-slate-100/80 p-1">
          {(["Payment", "Advance", "Refund"] as FrontOfficePaymentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPaymentType(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors sm:text-sm",
                paymentType === t
                  ? "bg-white text-emerald-700 shadow-sm"
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

      <FormField
        label={
          reservationPaymentModesNeedingExternalRef.has(mode)
            ? "External Reference ID"
            : "Transaction Reference"
        }
        required={reservationPaymentModesNeedingExternalRef.has(mode)}
        helperText={
          reservationPaymentModesNeedingExternalRef.has(mode)
            ? "Payment taken outside PMS — paste UPI or card transaction ID"
            : "Optional for cash payments"
        }
      >
        <TextInput
          placeholder={
            mode === "UPI"
              ? "e.g. UPI987654321"
              : mode === "Card"
                ? "e.g. AUTH123456"
                : "Optional"
          }
          value={txnRef}
          onChange={(e) => setTxnRef(e.target.value)}
        />
      </FormField>
    </div>
  );

  if (loading) return <p className="text-sm text-slate-500">Loading payments…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Payments"
        description="Record payments, advances, and refunds. View all front office transactions."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={openRecord}
            disabled={guests.length === 0}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Collected Today"
          value={formatINR(stats.collectedToday)}
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
        searchPlaceholder="Search by guest, booking no, transaction no, or external ref…"
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
        onClearAdvancedFilters={() => {
          setModeFilter("all");
          setSortBy("newest");
        }}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Payment Mode">
              <SelectInput value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                <option value="all">All modes</option>
                {paymentModes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
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
                {filtered.length} of {payments.length} front office transactions
              </div>
            </FormField>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Payment History</h2>

        {filtered.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Front office payments and reservation advances appear here once recorded."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPreviewPayment(r)}
                  className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{r.guestName}</p>
                      <p className="font-mono text-xs text-slate-400">{r.transactionNumber}</p>
                      {(r.bookingNo ?? r.bookingId) && (
                        <p className="text-xs text-slate-500">
                          Booking {r.bookingNo ?? r.bookingId}
                        </p>
                      )}
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

            <div className="hidden md:block">
              <div className="max-h-[min(520px,calc(100vh-420px))] overflow-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(241,245,249)]">
                    <tr className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Transaction No</th>
                      <th className="px-4 py-3">Guest</th>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">External Ref</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setPreviewPayment(r)}
                        className="cursor-pointer border-t border-slate-50 hover:bg-emerald-50/40"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-medium text-slate-800">
                            {r.transactionNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-medium text-slate-900">{r.guestName}</p>
                            {r.room && (
                              <p className="text-xs text-slate-400">Room {r.room}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-medium text-slate-700">
                            {r.bookingNo ?? r.bookingId ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              typeStyles[r.type],
                            )}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
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
                        <td className="px-4 py-3.5">{r.mode}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-slate-600">
                            {r.externalReference ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              statusStyles[r.status],
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <Drawer
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Record Payment"
        description="Collect payment or advance for an in-house guest."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRecordOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleSubmit}
              disabled={submitting || guests.length === 0}
            >
              {submitting
                ? "Recording…"
                : paymentType === "Refund"
                  ? "Process Refund"
                  : `Collect ${paymentType}`}
            </Button>
          </>
        }
      >
        {recordForm}
      </Drawer>

      <Drawer
        open={!!previewPayment}
        onClose={() => setPreviewPayment(null)}
        title={previewPayment?.transactionNumber ?? ""}
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
              <Button
                variant="outline"
                onClick={() => handlePrintReceipt(previewPayment)}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
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
                {
                  icon: Hash,
                  label: "Booking ID",
                  value: previewPayment.bookingNo ?? previewPayment.bookingId ?? "—",
                },
                {
                  icon: Hash,
                  label: "Folio ID",
                  value: previewPayment.folioNumber ?? previewPayment.folioId ?? "—",
                },
                { icon: CreditCard, label: "Payment Mode", value: previewPayment.mode },
                {
                  icon: Hash,
                  label: "Transaction No",
                  value: previewPayment.transactionNumber,
                },
                {
                  icon: Hash,
                  label: "External Ref",
                  value: previewPayment.externalReference ?? "—",
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
