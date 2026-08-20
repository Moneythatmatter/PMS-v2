"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Receipt, Wallet } from "lucide-react";
import type { FolioListItem, LedgerTransaction } from "@/app/data/types/billing";
import {
  paymentModes,
  reservationPaymentModesNeedingExternalRef,
} from "@/app/data/frontoffice/constants";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  FormField,
  SummaryRow,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { billingTransactionService } from "@/services/front-office";

function formatPaymentMethod(method?: string): string {
  if (!method) return "—";
  return method.replace(/_/g, " ");
}

interface CollectPaymentDrawerProps {
  folio: FolioListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (transaction: LedgerTransaction) => void;
}

export function CollectPaymentDrawer({
  folio,
  open,
  onClose,
  onSuccess,
}: CollectPaymentDrawerProps) {
  const balance = Number(folio?.balanceAmount ?? 0);

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successTxn, setSuccessTxn] = useState<LedgerTransaction | null>(null);

  const paymentOptions = useMemo(
    () => paymentModes.map((mode) => ({ id: mode, label: mode })),
    [],
  );

  const showExternalReference = reservationPaymentModesNeedingExternalRef.has(
    paymentMode,
  );

  useEffect(() => {
    if (!open || !folio) return;
    setAmount(balance > 0 ? String(balance) : "");
    setPaymentMode("");
    setExternalReference("");
    setNotes("");
    setError(null);
    setFieldErrors({});
    setSuccessTxn(null);
    setSubmitting(false);
  }, [open, folio?.id, balance]);

  const parsedAmount = Number(amount) || 0;
  const remainingAfterPayment = Math.max(0, balance - parsedAmount);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!parsedAmount || parsedAmount <= 0) {
      next.amount = "Enter a valid payment amount";
    } else if (parsedAmount > balance && balance > 0) {
      next.amount = `Amount cannot exceed outstanding balance (${formatINR(balance)})`;
    }
    if (!paymentMode.trim()) {
      next.paymentMode = "Select a payment method";
    }
    if (
      showExternalReference &&
      parsedAmount > 0 &&
      !externalReference.trim()
    ) {
      next.externalReference =
        paymentMode === "UPI"
          ? "Required — enter UPI transaction ID from your payment app"
          : "Required — enter card auth / reference from POS or bank";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!folio || !validate()) return;
    try {
      setSubmitting(true);
      setError(null);
      const txn = await billingTransactionService.recordFrontOfficePayment({
        amount: parsedAmount,
        paymentMethod: paymentMode,
        folioId: folio.id,
        bookingId: folio.bookingId ?? null,
        guestId: folio.guestId ?? null,
        externalReference: externalReference.trim() || null,
        notes: notes.trim() || null,
      });
      setSuccessTxn(txn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    if (successTxn) onSuccess(successTxn);
    onClose();
  };

  if (!folio) return null;

  return (
    <Drawer
      open={open}
      onClose={successTxn ? handleDone : onClose}
      title={successTxn ? "Payment Successful" : "Collect Payment"}
      description={
        successTxn
          ? `${folio.guestName ?? "Guest"} · ${folio.folioNumber ?? "Folio"}`
          : `${folio.guestName ?? "Guest"} · ${folio.folioNumber ?? "Folio"} · ${folio.room ? `Room ${folio.room}` : "Room TBA"}`
      }
      width="lg"
      footer={
        successTxn ? (
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={handleDone}
          >
            Done
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleSubmit}
              disabled={submitting || balance <= 0}
            >
              {submitting ? "Recording…" : "Mark as Paid"}
            </Button>
          </>
        )
      }
    >
      {successTxn ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatINR(successTxn.amount)}
            </p>
            <p className="mt-1 text-sm text-emerald-700">Payment recorded successfully</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Transaction</h3>
            <div className="divide-y divide-emerald-100/80 rounded-lg border border-emerald-100 bg-white px-3">
              <SummaryRow label="Transaction #" value={successTxn.transactionNumber} />
              <SummaryRow
                label="Payment method"
                value={formatPaymentMethod(successTxn.paymentMethod)}
              />
              <SummaryRow
                label="External ref"
                value={successTxn.externalReference ?? "—"}
              />
              <SummaryRow label="Status" value={successTxn.status} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Updated Folio</h3>
            <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-100 bg-white px-3">
              <SummaryRow label="Amount paid" value={formatINR(successTxn.amount)} />
              <SummaryRow
                label="New balance"
                value={formatINR(Math.max(0, balance - successTxn.amount))}
                highlight={Math.max(0, balance - successTxn.amount) > 0}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

          {balance <= 0 ? (
            <AlertBanner
              variant="info"
              message="This folio has no outstanding balance. No payment is required."
            />
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Folio Details</h3>
            </div>
            {(folio.checkIn || folio.checkOut) && (
              <p className="mb-3 text-xs text-slate-500">
                Stay: {folio.checkIn ?? "—"} → {folio.checkOut ?? "—"}
              </p>
            )}
            <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-100 bg-white px-3">
              <SummaryRow label="Guest" value={folio.guestName ?? "—"} />
              <SummaryRow
                label="Booking"
                value={folio.bookingNo ?? folio.bookingId?.slice(0, 8) ?? "—"}
              />
              <SummaryRow label="Room" value={folio.room ? `Room ${folio.room}` : "—"} />
              <SummaryRow label="Folio total" value={formatINR(folio.totalAmount)} />
              <SummaryRow label="Already paid" value={formatINR(folio.paidAmount)} />
              <SummaryRow
                label="Outstanding"
                value={formatINR(folio.balanceAmount)}
                highlight
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Payment</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Amount to collect (₹)" required>
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  max={balance > 0 ? balance : undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={balance <= 0}
                />
                {fieldErrors.amount && (
                  <p className="text-xs text-red-500">{fieldErrors.amount}</p>
                )}
              </FormField>

              <FormField label="Payment method" required>
                <SearchSelect
                  options={paymentOptions}
                  selectedId={paymentMode || null}
                  placeholder="Select payment mode…"
                  onSelect={(opt) => {
                    setPaymentMode(opt.id);
                    if (!reservationPaymentModesNeedingExternalRef.has(opt.id)) {
                      setExternalReference("");
                    }
                  }}
                  onClear={() => {
                    setPaymentMode("");
                    setExternalReference("");
                  }}
                />
                {fieldErrors.paymentMode && (
                  <p className="text-xs text-red-500">{fieldErrors.paymentMode}</p>
                )}
              </FormField>

              {showExternalReference && (
                <FormField
                  label="External Reference ID"
                  required
                  className="sm:col-span-2"
                  helperText="Payment was taken outside the PMS — paste the UPI or card transaction ID here"
                >
                  <TextInput
                    value={externalReference}
                    placeholder={
                      paymentMode === "UPI"
                        ? "e.g. UPI987654321"
                        : "e.g. AUTH123456 or bank ref"
                    }
                    onChange={(e) => setExternalReference(e.target.value)}
                  />
                  {fieldErrors.externalReference && (
                    <p className="text-xs text-red-500">{fieldErrors.externalReference}</p>
                  )}
                </FormField>
              )}

              <FormField label="Notes (optional)" className="sm:col-span-2">
                <TextAreaInput
                  value={notes}
                  placeholder="Front desk notes…"
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </FormField>
            </div>
          </div>

          {parsedAmount > 0 && paymentMode && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Payment Preview</h3>
              </div>
              <div className="divide-y divide-emerald-100/80 rounded-lg border border-emerald-100 bg-white px-3">
                <SummaryRow label="Collecting" value={formatINR(parsedAmount)} />
                <SummaryRow label="Payment method" value={paymentMode} />
                {showExternalReference && externalReference.trim() && (
                  <SummaryRow label="External ref" value={externalReference.trim()} />
                )}
                <SummaryRow
                  label="Balance after payment"
                  value={formatINR(remainingAfterPayment)}
                  highlight={remainingAfterPayment > 0}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
