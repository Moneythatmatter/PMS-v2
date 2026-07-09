"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CheckCircle2,
  Crown,
  CreditCard,
  FileText,
  LogOut,
  Phone,
  Printer,
  Receipt,
  Search,
  Users,
} from "lucide-react";
import { checkoutFolios, computeCheckoutTotals } from "@/app/data";
import type { CheckoutFolio } from "@/app/data/frontoffice/checkout";
import { paymentModes } from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SelectInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { CheckoutInvoiceDrawer } from "@/components/frontoffice/CheckoutInvoice";

type Step = "find" | "review" | "pay" | "done";

const steps: { id: Step; label: string; num: number }[] = [
  { id: "find", label: "Find Guest", num: 1 },
  { id: "review", label: "Review Folio", num: 2 },
  { id: "pay", label: "Settle Payment", num: 3 },
  { id: "done", label: "Complete", num: 4 },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function CheckOutView() {
  const [folios, setFolios] = useState(checkoutFolios);
  const [search, setSearch] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [selected, setSelected] = useState<CheckoutFolio | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [amountReceived, setAmountReceived] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const departingToday = useMemo(
    () => folios.filter((f) => f.departingToday),
    [folios],
  );

  const totals = useMemo(() => {
    if (!selected) return null;
    return computeCheckoutTotals(selected, discount);
  }, [selected, discount]);

  const currentStep: Step = completed
    ? "done"
    : !selected
      ? "find"
      : amountReceived >= (totals?.pending ?? 0)
        ? "pay"
        : "review";

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const loadGuest = (folio: CheckoutFolio) => {
    setSelected(folio);
    setSearch(folio.bookingId);
    setDiscount(folio.discount);
    setPaymentMode("UPI");
    setAmountReceived(computeCheckoutTotals(folio).pending);
    setLookupError("");
    setCompleted(false);
    setInvoiceNo(null);
    setShowInvoice(false);
  };

  const handleLookup = () => {
    setLookupError("");
    const query = search.trim().toLowerCase();
    const found = folios.find(
      (f) =>
        f.bookingId.toLowerCase() === query ||
        f.guestName.toLowerCase().includes(query) ||
        f.room === query,
    );
    if (!found) {
      setLookupError("No in-house guest found. Try BK-1040, James Wilson, or room 112.");
      setSelected(null);
      return;
    }
    loadGuest(found);
  };

  const handleGenerateInvoice = () => {
    if (!selected || !totals) return;
    const no = invoiceNo ?? `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoiceNo(no);
    setShowInvoice(true);
    setToast(`Invoice ${no} generated for ${selected.guestName}.`);
  };

  const invoiceData = selected && totals && invoiceNo
    ? {
        invoiceNo,
        invoiceDate: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        folio: selected,
        discount,
        paymentMode,
      }
    : null;

  const handleCheckout = () => {
    if (!selected || !totals) return;
    if (amountReceived < totals.pending) {
      setLookupError(`Amount received (${formatINR(amountReceived)}) is less than pending balance (${formatINR(totals.pending)}).`);
      return;
    }
    setFolios((prev) => prev.filter((f) => f.id !== selected.id));
    setCompleted(true);
    setToast(
      `${selected.guestName} checked out from Room ${selected.room}. ${formatINR(totals.pending)} collected via ${paymentMode}.`,
    );
  };

  const reset = () => {
    setSelected(null);
    setSearch("");
    setCompleted(false);
    setInvoiceNo(null);
    setLookupError("");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Check-Out"
        description="Settle guest folio, collect payment, and complete departure."
        badge={
          <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2.5">
            <Users className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Departing today</p>
              <p className="text-sm font-semibold text-slate-800">
                {departingToday.length} guest{departingToday.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        }
        action={
          selected && !completed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => (invoiceNo ? setShowInvoice(true) : handleGenerateInvoice())}
              >
                <FileText className="h-3.5 w-3.5" />
                {invoiceNo ? "View Invoice" : "Generate Invoice"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (!invoiceNo) handleGenerateInvoice();
                  else setShowInvoice(true);
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                onClick={handleCheckout}
                disabled={!paymentMode || amountReceived < (totals?.pending ?? 0)}
              >
                <LogOut className="h-3.5 w-3.5" />
                Complete Checkout
              </Button>
            </div>
          ) : null
        }
      />

      {/* Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {steps.map((step, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={step.id} className="flex min-w-0 flex-1 items-center">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isDone && "bg-emerald-500 text-white",
                      isActive && !isDone && "bg-blue-600 text-white ring-4 ring-blue-100",
                      !isActive && !isDone && "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span className={cn("hidden truncate text-sm font-medium sm:block", isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("mx-2 h-0.5 min-w-[16px] flex-1 rounded-full", i < stepIndex ? "bg-emerald-300" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {completed && selected && totals ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xl font-bold text-slate-900">Checkout Complete</p>
          <p className="mt-1 text-sm text-slate-600">
            {selected.guestName} · Room {selected.room} · {formatINR(totals.pending)} via {paymentMode}
          </p>
          {invoiceNo && (
            <p className="mt-2 text-xs font-medium text-emerald-700">Invoice: {invoiceNo}</p>
          )}
          <Button variant="outline" className="mt-6" onClick={reset}>
            Process Another Checkout
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left — search & departing list */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Find Guest</p>
                  <p className="text-xs text-slate-500">Booking ID, name, or room number</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="e.g. BK-1040 or James Wilson"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Button onClick={handleLookup} className="h-11 gap-2 bg-blue-600 hover:bg-blue-700">
                  Lookup Guest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {lookupError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{lookupError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/80 to-amber-50/50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900">Departing Today</p>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                  {departingToday.length}
                </span>
              </div>
              <div className="space-y-2">
                {departingToday.map((f) => {
                  const t = computeCheckoutTotals(f);
                  const isSelected = selected?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => loadGuest(f)}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                          : "border-white/80 bg-white hover:border-orange-300 hover:shadow-md",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold", isSelected ? "bg-blue-600 text-white" : "bg-orange-100 text-orange-700")}>
                          {getInitials(f.guestName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-slate-900">{f.guestName}</p>
                            {f.isVip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <p className="text-xs text-slate-500">{f.bookingId} · Room {f.room}</p>
                          <p className="mt-1 text-xs font-semibold text-orange-700">
                            Due: {formatINR(t.pending)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — folio & payment */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <LogOut className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-700">No guest selected</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Look up a guest or select from departing today to review folio and settle payment.
                </p>
              </div>
            ) : totals && (
              <div className="space-y-5">
                {/* Guest card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-lg font-bold text-white">
                        {getInitials(selected.guestName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-slate-900">{selected.guestName}</p>
                          {selected.isVip && <Crown className="h-4 w-4 text-amber-500" />}
                        </div>
                        <p className="text-sm text-slate-500">{selected.bookingId}</p>
                      </div>
                    </div>
                    <button type="button" onClick={reset} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                      Change guest
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { icon: BedDouble, label: "Room", value: `${selected.room} · ${selected.roomType}` },
                      { icon: Calendar, label: "Stay", value: `${selected.checkIn} – ${selected.checkOut}` },
                      { icon: Phone, label: "Mobile", value: selected.phone },
                      { icon: Receipt, label: "Nights", value: `${selected.nights} nights` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-slate-400">
                          <Icon className="h-3 w-3" />
                          {label}
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill summary */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Bill Summary</h3>
                    {invoiceNo && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {invoiceNo}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0 divide-y divide-slate-50">
                    {[
                      ["Room Charges", selected.roomCharges],
                      ["Restaurant Charges", selected.restaurantCharges],
                      ["Laundry", selected.laundry],
                      ["Mini Bar", selected.miniBar],
                      ["Extra Bed", selected.extraBed],
                      ...(selected.otherCharges > 0 ? [["Other Charges", selected.otherCharges] as const] : []),
                      ["Tax (GST)", selected.gst],
                    ].map(([label, amount]) => (
                      <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-medium text-slate-900">{formatINR(amount as number)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          min={0}
                          value={discount}
                          onChange={(e) => {
                            setDiscount(Number(e.target.value));
                            const t = computeCheckoutTotals(selected, Number(e.target.value));
                            setAmountReceived(t.pending);
                          }}
                          className="h-8 w-24 rounded-lg text-right text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span>Advance Paid</span>
                      <span>− {formatINR(selected.advancePaid)}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-100">Amount Due</p>
                        <p className="text-2xl font-bold">{formatINR(totals.pending)}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">Settle Payment</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Payment Mode">
                      <SelectInput
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="rounded-xl"
                      >
                        {paymentModes.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </SelectInput>
                    </FormField>
                    <FormField label="Amount Received">
                      <TextInput
                        type="number"
                        min={0}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(Number(e.target.value))}
                        className="rounded-xl"
                      />
                    </FormField>
                  </div>
                  {amountReceived > totals.pending && (
                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      Change to return: {formatINR(amountReceived - totals.pending)}
                    </p>
                  )}
                  {amountReceived < totals.pending && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      Remaining: {formatINR(totals.pending - amountReceived)}
                    </p>
                  )}
                </div>

                <Button
                  className="h-12 w-full gap-2 bg-blue-600 hover:bg-blue-700 lg:hidden"
                  onClick={handleCheckout}
                  disabled={!paymentMode || amountReceived < totals.pending}
                >
                  <LogOut className="h-4 w-4" />
                  Complete Checkout — {formatINR(totals.pending)}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <CheckoutInvoiceDrawer
        open={showInvoice}
        onClose={() => setShowInvoice(false)}
        data={invoiceData}
      />
    </div>
  );
}
