"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  SplitSquareHorizontal,
} from "lucide-react";
import { computeCheckoutTotals, computeCheckoutBills } from "@/app/data";
import type { CheckoutFolio, SplittableChargeKey } from "@/app/data/frontoffice/checkout";
import { paymentModes, reservationPaymentModesNeedingExternalRef } from "@/app/data/frontoffice/constants";
import { reservationService } from "@/services/front-office";
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
import { displayBookingNo } from "@/lib/booking-display";
import { isDepartingOnDate, isDepartingToday, todayIso } from "@/lib/reservation-dates";
import { CheckoutInvoiceDrawer } from "@/components/frontoffice/CheckoutInvoice";

type Step = "find" | "review" | "pay" | "done";

const steps: { id: Step; label: string; num: number }[] = [
  { id: "find", label: "Find Guest", num: 1 },
  { id: "review", label: "Review Folio", num: 2 },
  { id: "pay", label: "Settle Payment", num: 3 },
  { id: "done", label: "Complete", num: 4 },
];

type BillLineKey = SplittableChargeKey | "roomCharges" | "gst";

const BILL_LINES: { key: BillLineKey; label: string; splittable: boolean }[] = [
  { key: "roomCharges", label: "Room Charges", splittable: false },
  { key: "restaurantCharges", label: "Restaurant Charges", splittable: true },
  { key: "laundry", label: "Laundry", splittable: true },
  { key: "miniBar", label: "Mini Bar", splittable: true },
  { key: "extraBed", label: "Extra Bed", splittable: true },
  { key: "otherCharges", label: "Other Charges", splittable: true },
  { key: "gst", label: "Tax (GST)", splittable: false },
];


function formatRoomLabel(room?: string): string {
  const value = String(room ?? "").trim();
  if (!value || value === "TBA") return "TBA";
  if (/^[0-9a-f-]{36}$/i.test(value)) return "TBA";
  return value;
}

function mapInHouseToFolio(g: {
  id: string;
  bookingNo?: string;
  guestName: string;
  email?: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  balance: number;
  restaurantBill?: number;
  laundry?: number;
  isVip?: boolean;
}): CheckoutFolio {
  const restaurant = g.restaurantBill || 0;
  const laundry = g.laundry || 0;
  return {
    id: g.id,
    bookingId: displayBookingNo(g),
    guestName: g.guestName,
    phone: "",
    email: g.email,
    room: formatRoomLabel(g.room),
    roomType: g.roomType,
    checkIn: g.checkIn,
    checkOut: g.checkOut,
    nights: g.nights,
    adults: g.adults,
    children: g.children,
    roomCharges: Math.max(0, g.balance - restaurant - laundry),
    restaurantCharges: restaurant,
    laundry,
    miniBar: 0,
    extraBed: 0,
    otherCharges: 0,
    gst: 0,
    discount: 0,
    advancePaid: 0,
    isVip: g.isVip,
    departingToday: isDepartingToday({ checkOut: g.checkOut }),
  };
}

function getInitials(name?: string) {
  if (!name?.trim()) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

type DepartureFilter = "all" | "today" | "date";

export function CheckOutView() {
  const searchParams = useSearchParams();
  const prefillBookingKey =
    searchParams.get("bookingId") ?? searchParams.get("booking") ?? "";
  const prefillAttempted = useRef<string | null>(null);

  const [folios, setFolios] = useState<CheckoutFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [selected, setSelected] = useState<CheckoutFolio | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [externalReference, setExternalReference] = useState("");
  const [amountReceived, setAmountReceived] = useState(0);
  const [departureFilter, setDepartureFilter] = useState<DepartureFilter>("all");
  const [departureDate, setDepartureDate] = useState(todayIso());
  const [invoiceNos, setInvoiceNos] = useState<Record<string, string>>({});
  const [activeInvoiceBillId, setActiveInvoiceBillId] = useState<string | null>(null);
  const [splitBilling, setSplitBilling] = useState(false);
  const [separateBillItems, setSeparateBillItems] = useState<SplittableChargeKey[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const inHouse = await reservationService.inHouse();
        if (!cancelled) {
          setFolios(inHouse.map(mapInHouseToFolio));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const departingToday = useMemo(
    () => folios.filter((f) => isDepartingToday(f)),
    [folios],
  );

  const checkedInGuests = useMemo(() => {
    return [...folios].sort((a, b) => {
      const aDeparting = isDepartingToday(a) ? 0 : 1;
      const bDeparting = isDepartingToday(b) ? 0 : 1;
      if (aDeparting !== bDeparting) return aDeparting - bDeparting;
      return String(a.checkOut ?? "").localeCompare(String(b.checkOut ?? ""));
    });
  }, [folios]);

  const filteredCheckedInGuests = useMemo(() => {
    if (departureFilter === "today") {
      return checkedInGuests.filter((f) => isDepartingToday(f));
    }
    if (departureFilter === "date" && departureDate) {
      return checkedInGuests.filter((f) => isDepartingOnDate(f, departureDate));
    }
    return checkedInGuests;
  }, [checkedInGuests, departureFilter, departureDate]);

  const showExternalReference = reservationPaymentModesNeedingExternalRef.has(
    paymentMode,
  );
  const externalReferenceRequired =
    showExternalReference && amountReceived > 0;

  const billBreakdown = useMemo(() => {
    if (!selected) return null;
    return computeCheckoutBills(
      selected,
      discount,
      splitBilling ? separateBillItems : [],
    );
  }, [selected, discount, splitBilling, separateBillItems]);

  const totals = billBreakdown?.totals ?? null;

  const currentStep: Step = completed
    ? "done"
    : !selected
      ? "find"
      : amountReceived >= (totals?.pending ?? 0)
        ? "pay"
        : "review";

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const loadGuest = useCallback((folio: CheckoutFolio) => {
    setSelected(folio);
    setSearch(folio.bookingId);
    setDiscount(folio.discount);
    setPaymentMode("UPI");
    setExternalReference("");
    setAmountReceived(computeCheckoutTotals(folio).pending);
    setLookupError("");
    setCompleted(false);
    setInvoiceNos({});
    setActiveInvoiceBillId(null);
    setSplitBilling(false);
    setSeparateBillItems([]);
    setShowInvoice(false);
  }, []);

  useEffect(() => {
    if (!prefillBookingKey || folios.length === 0) return;
    if (prefillAttempted.current === prefillBookingKey) return;

    const query = prefillBookingKey.trim().toLowerCase();
    const found = folios.find(
      (f) =>
        f.id === prefillBookingKey ||
        f.bookingId.toLowerCase() === query ||
        f.id.toLowerCase() === query,
    );

    prefillAttempted.current = prefillBookingKey;

    if (found) {
      loadGuest(found);
      setToast(`Loaded checkout for ${found.guestName}.`);
      return;
    }

    setLookupError(
      `In-house booking "${prefillBookingKey}" was not found. The guest may not be checked in yet.`,
    );
  }, [prefillBookingKey, folios, loadGuest]);

  const handleLookup = () => {
    setLookupError("");
    const query = search.trim().toLowerCase();
    const found = folios.find(
      (f) =>
        f.id.toLowerCase() === query ||
        f.bookingId.toLowerCase() === query ||
        f.guestName.toLowerCase().includes(query) ||
        formatRoomLabel(f.room).toLowerCase() === query,
    );
    if (!found) {
      setLookupError("No in-house guest found. Try BK-0, James Wilson, or room 112.");
      setSelected(null);
      return;
    }
    loadGuest(found);
  };

  const toggleSeparateBillItem = (key: SplittableChargeKey) => {
    setSeparateBillItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setInvoiceNos({});
    setActiveInvoiceBillId(null);
  };

  const getBillAmount = (key: BillLineKey) => {
    if (!selected) return 0;
    if (key === "gst") return selected.gst;
    return selected[key];
  };

  const generateInvoiceNo = () => `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleGenerateInvoice = (billId?: string) => {
    if (!selected || !totals || !billBreakdown) return;
    const targetBill = billId
      ? billBreakdown.bills.find((b) => b.id === billId)
      : billBreakdown.bills[0];
    if (!targetBill) return;

    const no = invoiceNos[targetBill.id] ?? generateInvoiceNo();
    setInvoiceNos((prev) => ({ ...prev, [targetBill.id]: no }));
    setActiveInvoiceBillId(targetBill.id);
    setShowInvoice(true);
    setToast(
      splitBilling && billBreakdown.bills.length > 1
        ? `${targetBill.label} invoice ${no} generated for ${selected.guestName}.`
        : `Invoice ${no} generated for ${selected.guestName}.`,
    );
  };

  const handleGenerateAllInvoices = () => {
    if (!selected || !billBreakdown) return;
    const next: Record<string, string> = { ...invoiceNos };
    for (const bill of billBreakdown.bills) {
      if (!next[bill.id]) next[bill.id] = generateInvoiceNo();
    }
    setInvoiceNos(next);
    setActiveInvoiceBillId(billBreakdown.bills[0]?.id ?? null);
    setShowInvoice(true);
    setToast(
      `${billBreakdown.bills.length} split invoice${billBreakdown.bills.length !== 1 ? "s" : ""} generated for ${selected.guestName}.`,
    );
  };

  const activeBill = billBreakdown?.bills.find((b) => b.id === activeInvoiceBillId) ?? billBreakdown?.bills[0];
  const invoiceData = selected && totals && activeBill && invoiceNos[activeBill.id]
    ? {
        invoiceNo: invoiceNos[activeBill.id],
        invoiceDate: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        folio: selected,
        discount: activeBill.discount,
        paymentMode,
        bill: splitBilling && billBreakdown && billBreakdown.bills.length > 1 ? activeBill : undefined,
        billTitle: splitBilling && billBreakdown && billBreakdown.bills.length > 1 ? activeBill.label : undefined,
      }
    : null;

  const handleCheckout = async () => {
    if (!selected || !totals) return;
    if (amountReceived < totals.pending) {
      setLookupError(`Amount received (${formatINR(amountReceived)}) is less than pending balance (${formatINR(totals.pending)}).`);
      return;
    }
    if (externalReferenceRequired && !externalReference.trim()) {
      setLookupError(
        paymentMode === "UPI"
          ? "Enter the UPI transaction ID from your payment app."
          : "Enter the card authorization or bank reference for this payment.",
      );
      return;
    }
    try {
      await reservationService.checkOut(selected.id, {
        paymentMode,
        amountReceived,
        externalReference: externalReference.trim() || undefined,
      });
      setFolios((prev) => prev.filter((f) => f.id !== selected.id));
      setCompleted(true);
      const billNote =
        splitBilling && billBreakdown && billBreakdown.bills.length > 1
          ? ` across ${billBreakdown.bills.length} bills`
          : "";
      setToast(
        `${selected.guestName} checked out from Room ${selected.room}. ${formatINR(totals.pending)} collected via ${paymentMode}${billNote}.`,
      );
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Check-out failed");
    }
  };

  const reset = () => {
    setSelected(null);
    setSearch("");
    setCompleted(false);
    setInvoiceNos({});
    setActiveInvoiceBillId(null);
    setSplitBilling(false);
    setSeparateBillItems([]);
    setLookupError("");
  };

  const hasAnyInvoice = Object.keys(invoiceNos).length > 0;

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

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
              <p className="text-xs font-medium text-slate-500">Checked in</p>
              <p className="text-sm font-semibold text-slate-800">
                {folios.length} guest{folios.length !== 1 ? "s" : ""}
                {departingToday.length > 0 && (
                  <span className="font-normal text-orange-600">
                    {" "}
                    · {departingToday.length} out today
                  </span>
                )}
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
                onClick={() => {
                  if (hasAnyInvoice && activeInvoiceBillId) setShowInvoice(true);
                  else if (splitBilling && billBreakdown && billBreakdown.bills.length > 1) handleGenerateAllInvoices();
                  else handleGenerateInvoice();
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                {hasAnyInvoice ? "View Invoice" : splitBilling && billBreakdown && billBreakdown.bills.length > 1 ? "Generate Invoices" : "Generate Invoice"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (!hasAnyInvoice) {
                    if (splitBilling && billBreakdown && billBreakdown.bills.length > 1) handleGenerateAllInvoices();
                    else handleGenerateInvoice();
                  } else setShowInvoice(true);
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                onClick={handleCheckout}
                disabled={
                  !paymentMode ||
                  amountReceived < (totals?.pending ?? 0) ||
                  (externalReferenceRequired && !externalReference.trim())
                }
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
                      isActive && !isDone && "bg-emerald-700 text-white ring-4 ring-emerald-100",
                      !isActive && !isDone && "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span className={cn("hidden truncate text-sm font-medium sm:block", isActive ? "text-emerald-700" : isDone ? "text-emerald-600" : "text-slate-400")}>
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
          {hasAnyInvoice && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              {Object.entries(invoiceNos).map(([id, no]) => no).join(" · ")}
            </p>
          )}
          <Button variant="outline" className="mt-6" onClick={reset}>
            Process Another Checkout
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          {/* Left — search & departing list */}
          <div className="space-y-5 lg:sticky lg:top-4 lg:col-span-2 lg:self-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
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
                  placeholder="e.g. BK-0 or James Wilson"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <Button onClick={handleLookup} className="h-11 gap-2 bg-emerald-700 hover:bg-emerald-800">
                  Lookup Guest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {lookupError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{lookupError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/80 to-amber-50/50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-orange-900">
                    Checked-In Guests
                  </p>
                  <p className="mt-0.5 text-[11px] text-orange-700/80">
                    All in-house bookings · select to check out
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                  {filteredCheckedInGuests.length}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDepartureFilter("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    departureFilter === "all"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-white/80 text-orange-800 hover:bg-white",
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDepartureFilter("today");
                    setDepartureDate(todayIso());
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    departureFilter === "today"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-white/80 text-orange-800 hover:bg-white",
                  )}
                >
                  Today
                </button>
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-orange-200/80 bg-white/90 px-2.5 py-1.5 sm:flex-none">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDepartureDate(next);
                      setDepartureFilter(next ? "date" : "all");
                    }}
                    className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                    aria-label="Filter by checkout date"
                  />
                </label>
              </div>

              <div className="space-y-2">
                {filteredCheckedInGuests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-orange-200 bg-white/70 px-3 py-6 text-center text-sm text-slate-500">
                    {departureFilter === "all"
                      ? "No checked-in guests right now"
                      : departureFilter === "today"
                        ? "No guests checking out today"
                        : `No guests checking out on ${departureDate}`}
                  </p>
                ) : (
                  filteredCheckedInGuests.map((f) => {
                  const t = computeCheckoutTotals(f);
                  const isSelected = selected?.id === f.id;
                  const leavingToday = isDepartingToday(f);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => loadGuest(f)}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-white/80 bg-white hover:border-orange-300 hover:shadow-md",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold", isSelected ? "bg-emerald-700 text-white" : "bg-orange-100 text-orange-700")}>
                          {getInitials(f.guestName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-slate-900">{f.guestName}</p>
                            {f.isVip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                            {leavingToday && (
                              <span className="shrink-0 rounded-full bg-orange-200 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
                                Out today
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {f.bookingId} · Room {formatRoomLabel(f.room)}
                            {f.checkOut ? ` · Out ${f.checkOut}` : ""}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-orange-700">
                            Due: {formatINR(t.pending)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
                )}
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
                  Look up a guest or pick from the checked-in list to review folio and settle payment.
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
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">Bill Summary</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitBilling((v) => !v);
                        if (splitBilling) setSeparateBillItems([]);
                        setInvoiceNos({});
                        setActiveInvoiceBillId(null);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                        splitBilling
                          ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      <SplitSquareHorizontal className="h-3.5 w-3.5" />
                      Split Billing
                    </button>
                  </div>

                  {splitBilling && (
                    <p className="mb-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
                      Select charges to bill separately — e.g. laundry, mini bar, or restaurant for company reimbursement.
                    </p>
                  )}

                  <div className="space-y-0 divide-y divide-slate-50">
                    {BILL_LINES.map(({ key, label, splittable }) => {
                      const amount = getBillAmount(key);
                      if (amount <= 0) return null;
                      const isSeparate =
                        splittable &&
                        splitBilling &&
                        separateBillItems.includes(key as SplittableChargeKey);

                      return (
                        <div key={key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            {splittable && splitBilling && (
                              <input
                                type="checkbox"
                                checked={separateBillItems.includes(key as SplittableChargeKey)}
                                onChange={() => toggleSeparateBillItem(key as SplittableChargeKey)}
                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                aria-label={`Bill ${label} separately`}
                              />
                            )}
                            <span className={cn("text-slate-600", isSeparate && "text-violet-700")}>
                              {label}
                            </span>
                            {isSeparate && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                Separate bill
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 font-medium text-slate-900">{formatINR(amount)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {splitBilling && separateBillItems.length > 0 && billBreakdown && billBreakdown.bills.length > 1 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Split Bills</p>
                      {billBreakdown.bills.map((bill) => (
                        <div
                          key={bill.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-3 py-2.5",
                            bill.isMain
                              ? "border-emerald-100 bg-emerald-50/50"
                              : "border-violet-100 bg-violet-50/50",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{bill.label}</p>
                            <p className="text-[11px] text-slate-500">
                              Incl. GST {formatINR(bill.gst)}
                              {bill.discount > 0 ? ` · Disc. ${formatINR(bill.discount)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{formatINR(bill.due)}</p>
                            <button
                              type="button"
                              onClick={() => handleGenerateInvoice(bill.id)}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                              {invoiceNos[bill.id] ? "View" : "Invoice"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          min={0}
                          value={discount}
                          onChange={(e) => {
                            const nextDiscount = Number(e.target.value);
                            setDiscount(nextDiscount);
                            const t = computeCheckoutTotals(selected, nextDiscount);
                            setAmountReceived(t.pending);
                            setInvoiceNos({});
                            setActiveInvoiceBillId(null);
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

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-emerald-100">
                          {splitBilling && separateBillItems.length > 0 ? "Total Amount Due" : "Amount Due"}
                        </p>
                        <p className="text-2xl font-bold">{formatINR(totals.pending)}</p>
                        {splitBilling && separateBillItems.length > 0 && billBreakdown && (
                          <p className="mt-0.5 text-xs text-emerald-200">
                            Across {billBreakdown.bills.length} bill{billBreakdown.bills.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <CreditCard className="h-8 w-8 text-emerald-200" />
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
                        onChange={(e) => {
                          const next = e.target.value;
                          setPaymentMode(next);
                          if (!reservationPaymentModesNeedingExternalRef.has(next)) {
                            setExternalReference("");
                          }
                        }}
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
                    {showExternalReference && (
                      <FormField
                        label="External Reference ID"
                        required={externalReferenceRequired}
                        className="sm:col-span-2"
                        helperText={
                          paymentMode === "UPI"
                            ? "Paste the UPI transaction ID from your payment app"
                            : "Paste the card authorization or bank reference"
                        }
                      >
                        <TextInput
                          value={externalReference}
                          placeholder={
                            paymentMode === "UPI"
                              ? "e.g. UPI987654321"
                              : "e.g. AUTH123456 or bank ref"
                          }
                          onChange={(e) => setExternalReference(e.target.value)}
                          className="rounded-xl border-emerald-300 ring-1 ring-emerald-100 focus:border-emerald-500"
                        />
                      </FormField>
                    )}
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
                  className="h-12 w-full gap-2 bg-emerald-700 hover:bg-emerald-800 lg:hidden"
                  onClick={handleCheckout}
                  disabled={
                    !paymentMode ||
                    amountReceived < totals.pending ||
                    (externalReferenceRequired && !externalReference.trim())
                  }
                >
                  <LogOut className="h-4 w-4" />
                  Complete Checkout — {formatINR(totals.pending)}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showInvoice && splitBilling && billBreakdown && billBreakdown.bills.length > 1 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {billBreakdown.bills.map((bill) => (
            <button
              key={bill.id}
              type="button"
              onClick={() => setActiveInvoiceBillId(bill.id)}
              className={cn(
                "rounded-xl px-3 py-2 text-left text-xs transition-colors",
                activeInvoiceBillId === bill.id
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              <p className="font-semibold">{bill.label}</p>
              <p className={cn("mt-0.5", activeInvoiceBillId === bill.id ? "text-emerald-100" : "text-slate-500")}>
                {formatINR(bill.due)}
                {invoiceNos[bill.id] ? ` · ${invoiceNos[bill.id]}` : ""}
              </p>
            </button>
          ))}
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
