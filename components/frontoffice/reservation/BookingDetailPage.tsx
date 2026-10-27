"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  BedDouble,
  Building2,
  Calendar,
  CalendarPlus,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Pencil,
  Phone,
  PlusCircle,
  Printer,
  Receipt,
  User,
  UserCog,
  UserX,
  Users,
  Utensils,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import type { ReservationBooking } from "@/app/data/types";
import type { FolioCharge, FolioListItem, LedgerTransaction } from "@/app/data/types/billing";
import {
  reservationService,
  type ReservationGuestLinkDto,
} from "@/services/front-office/reservations";
import {
  billingFolioService,
  billingTransactionService,
  folioChargeService,
} from "@/services/front-office";
import type { FolioChargeCategory } from "@/services/billing";
import { Button } from "@/components/ui/Button";
import { AlertBanner, ConfirmModal, formatINR } from "@/components/frontoffice/ui";
import { CollectPaymentDrawer } from "@/components/frontoffice/CollectPaymentDrawer";
import { BookingAddChargeDrawer, CHARGE_CATEGORY_LABELS } from "./BookingAddChargeDrawer";
import { BookingRoomTransferDrawer } from "./BookingRoomTransferDrawer";
import { BookingExtendStayDrawer } from "./BookingExtendStayDrawer";
import { GuestDocumentsPanel } from "@/components/frontoffice/guest-documents/GuestDocumentsPanel";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { cn } from "@/lib/utils";
import { displayBookingNo } from "@/lib/booking-display";
import {
  checkInHref,
  checkOutHref,
  guestFolioHref,
  guestProfileHref,
} from "@/lib/check-in-navigation";
import { isNoShowEligible } from "@/lib/reservation-dates";
import { printBookingDetail } from "./bookingPrintUtils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

const ALL_BOOKINGS_HREF = "/frontoffice/reservation/all-bookings";
const CLOSED_STATUSES = new Set(["Cancelled", "Checked Out", "No Show"]);
const VOIDED_STATUSES = new Set(["Cancelled", "No Show"]);

type FolioLedgerLine = {
  id: string;
  label: string;
  detail: string;
  ref?: string;
  debit: number;
  credit: number;
  date: string;
  balance: number;
};

const SOURCE_LABELS: Record<string, string> = {
  FNB: "Food & Beverage",
  HOUSEKEEPING: "Housekeeping",
  FRONT_OFFICE: "Front Office",
  RESERVATION: "Reservation",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function pickFolio(folios: FolioListItem[]): FolioListItem | null {
  return folios.find((f) => f.status === "OPEN") ?? folios[0] ?? null;
}

function formatActivityDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isReversal(t: LedgerTransaction): boolean {
  return /REVERSAL/i.test(t.sourceType ?? "") || /reversal/i.test(t.notes ?? "");
}

function describeAdjustment(t: LedgerTransaction): string {
  const source = String(t.sourceType ?? "").toUpperCase();
  if (source.startsWith("ROOM_SERVICE")) return isReversal(t) ? "Room service reversal" : "Room service";
  if (source.includes("LAUNDRY") || /\[LAUNDRY\]/.test(t.notes ?? "")) return "Laundry";
  if (isReversal(t)) return "Charge reversal";
  return SOURCE_LABELS[String(t.sourceModule ?? "")] ?? "Folio charge";
}

/**
 * Chronological folio ledger. Room revenue on individual folios lives only in
 * the seeded subtotal, so whatever the posted lines don't explain is shown as
 * the room-charges line.
 */
function buildFolioLedger(
  folio: FolioListItem,
  booking: ReservationBooking,
  charges: FolioCharge[],
  transactions: LedgerTransaction[],
): FolioLedgerLine[] {
  const lines: Omit<FolioLedgerLine, "balance">[] = [];

  for (const c of charges) {
    if (c.folioId !== folio.id) continue;
    lines.push({
      id: `c-${c.id}`,
      label: c.description || "Charge",
      detail: [
        CHARGE_CATEGORY_LABELS[c.chargeCategory as FolioChargeCategory] ?? c.chargeCategory,
        Number(c.quantity ?? 1) > 1 ? `${c.quantity} × ${formatINR(Number(c.unitPrice ?? 0))}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      debit: Number(c.amount ?? 0),
      credit: 0,
      date: c.createdAt ?? "",
    });
  }

  for (const t of transactions) {
    if (t.folioId !== folio.id || t.status !== "COMPLETED") continue;
    const amount = Number(t.amount ?? 0);
    const method = t.paymentMethod?.replace(/_/g, " ");
    if (t.transactionType === "PAYMENT") {
      lines.push({
        id: `t-${t.id}`,
        label: "Payment received",
        detail: [method, t.externalReference].filter(Boolean).join(" · "),
        ref: t.transactionNumber,
        debit: 0,
        credit: amount,
        date: t.transactionDate,
      });
    } else if (t.transactionType === "REFUND") {
      lines.push({
        id: `t-${t.id}`,
        label: "Refund",
        detail: method ?? "",
        ref: t.transactionNumber,
        debit: amount,
        credit: 0,
        date: t.transactionDate,
      });
    } else {
      const reversal = isReversal(t);
      lines.push({
        id: `t-${t.id}`,
        label: describeAdjustment(t),
        detail: (t.notes ?? "").replace(/^\[[A-Z_]+\]\s*/, ""),
        ref: t.transactionNumber,
        debit: reversal ? 0 : amount,
        credit: reversal ? amount : 0,
        date: t.transactionDate,
      });
    }
  }

  const postedCharges = lines
    .filter((l) => l.label !== "Payment received" && l.label !== "Refund")
    .reduce((sum, l) => sum + l.debit - l.credit, 0);
  const roomCharges = round2(Number(folio.subtotal ?? 0) - postedCharges);
  if (roomCharges > 0.009) {
    lines.push({
      id: "room",
      label: "Room charges",
      detail: `${booking.nights || 1} night${(booking.nights || 1) !== 1 ? "s" : ""}${booking.roomNo ? ` · Room ${booking.roomNo}` : ""}${booking.tariffPlan ? ` · ${booking.tariffPlan}` : ""}`,
      debit: roomCharges,
      credit: 0,
      date: folio.openedAt ?? "",
    });
  }
  if (Number(folio.taxTotal ?? 0) > 0) {
    lines.push({ id: "tax", label: "Tax", detail: "", debit: Number(folio.taxTotal), credit: 0, date: "~" });
  }
  if (Number(folio.discountTotal ?? 0) > 0) {
    lines.push({ id: "discount", label: "Discount", detail: "", debit: 0, credit: Number(folio.discountTotal), date: "~" });
  }

  lines.sort((a, b) => {
    if (a.id === "room") return -1;
    if (b.id === "room") return 1;
    return a.date.localeCompare(b.date);
  });

  let running = 0;
  return lines.map((l) => {
    running = round2(running + l.debit - l.credit);
    return { ...l, balance: running };
  });
}

/** Server returns flattened guest fields; older shape nests them under `guest`. */
type GuestLink = ReservationGuestLinkDto & {
  guestName?: string;
  guestNo?: string;
  mobile?: string;
  email?: string;
};

function getInitials(name?: string) {
  if (!name?.trim()) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Card({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

type BookingAction = {
  key: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "warning" | "danger";
};

function ActionRow({ action }: { action: BookingAction }) {
  const Icon = action.icon;
  const className = cn(
    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50",
    action.tone === "primary"
      ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
      : action.tone === "danger"
        ? "border-red-100 text-red-600 hover:bg-red-50"
        : action.tone === "warning"
          ? "border-orange-100 text-orange-700 hover:bg-orange-50"
          : "border-slate-200 text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/50",
  );
  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          action.tone === "primary" ? "bg-white/15" : "bg-slate-50",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{action.label}</span>
        <span
          className={cn(
            "block truncate text-[11px]",
            action.tone === "primary" ? "text-emerald-100" : "text-slate-500",
          )}
        >
          {action.hint}
        </span>
      </span>
    </>
  );
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={action.onClick} disabled={action.disabled}>
      {content}
    </button>
  );
}

function RefLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-0.5 break-words text-sm font-medium", empty ? "text-slate-400" : "text-slate-900")}>
        {empty ? "—" : value}
      </p>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: "slate" | "amber" | "emerald";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p
        className={cn(
          "mt-1 truncate text-sm font-bold",
          tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-700" : "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function BookingDetailPage({ bookingId }: { bookingId: string }) {
  const propertyCtx = usePropertyOptional();
  const propertyName = propertyCtx?.property?.name ?? "IMPACT PMS";

  const [booking, setBooking] = useState<ReservationBooking | null>(null);
  const [guests, setGuests] = useState<GuestLink[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirm, setConfirm] = useState<"cancel" | "no-show" | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [folio, setFolio] = useState<FolioListItem | null>(null);
  const [charges, setCharges] = useState<FolioCharge[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [drawer, setDrawer] = useState<"transfer" | "extend" | "charge" | "payment" | null>(null);
  const [openingPayment, setOpeningPayment] = useState(false);

  const folioLedger = useMemo(
    () => (folio && booking ? buildFolioLedger(folio, booking, charges, transactions) : []),
    [folio, booking, charges, transactions],
  );

  const openPayment = async () => {
    if (!booking) return;
    if (folio) {
      setDrawer("payment");
      return;
    }
    setOpeningPayment(true);
    try {
      const ensured = await billingFolioService.ensure(booking.id, booking.guestId);
      setFolio(ensured);
      setDrawer("payment");
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Unable to open folio", variant: "error" });
    } finally {
      setOpeningPayment(false);
    }
  };

  const afterAction = (message: string) => {
    setDrawer(null);
    setToast({ message, variant: "success" });
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    reservationService
      .get(bookingId)
      .then((row) =>
        Promise.all([
          reservationService.guests(row.id).catch(() => [] as ReservationGuestLinkDto[]),
          billingFolioService.list({ bookingId: row.id }).catch(() => [] as FolioListItem[]),
          folioChargeService.list(row.id).catch(() => [] as FolioCharge[]),
          billingTransactionService
            .list({ bookingId: row.id })
            .catch(() => [] as LedgerTransaction[]),
        ]).then(([links, folios, chargeRows, txns]) => {
          if (cancelled) return;
          setBooking(row);
          setGuests(links as GuestLink[]);
          setFolio(pickFolio(folios));
          setCharges(chargeRows);
          setTransactions(txns);
          setLoadError(null);
        }),
      )
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Booking not found");
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, reloadKey]);

  const runStatusChange = async () => {
    if (!booking || !confirm) return;
    const status = confirm === "cancel" ? ("Cancelled" as const) : ("No Show" as const);
    setSaving(true);
    try {
      await reservationService.update(booking.id, { status });
      setToast({
        message:
          confirm === "cancel"
            ? `Booking ${displayBookingNo(booking)} has been cancelled.`
            : `Booking ${displayBookingNo(booking)} marked as no show. Room released.`,
        variant: "success",
      });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to update booking", variant: "error" });
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href={ALL_BOOKINGS_HREF} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to All Bookings
        </Link>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      </div>
    );
  }

  if (!booking) return <p className="text-sm text-slate-500">Loading booking…</p>;

  const nights = booking.nights || 1;
  const total = booking.totalAmount ?? booking.balance + (booking.advancePaid ?? 0);
  const roomRate = booking.roomRate ?? Math.round(total / nights);
  const advance = booking.advancePaid ?? 0;
  const isInHouse = booking.status === "Checked In" || booking.status === "In-House";
  const isClosed = CLOSED_STATUSES.has(booking.status);
  const isVoided = VOIDED_STATUSES.has(booking.status);
  const folioOpen = !folio || folio.status === "OPEN";
  const balanceDue = folio ? Number(folio.balanceAmount ?? 0) : booking.balance;
  const canAddCharge = !isClosed && folioOpen;
  const canAddPayment = !isVoided && (!isClosed || balanceDue > 0);
  const isReserved = !isClosed && !isInHouse;
  const editReservationHref = `/frontoffice/reservation/new?bookingId=${encodeURIComponent(booking.id)}`;

  const actions: BookingAction[] = [
    isInHouse && {
      key: "check-out",
      label: "Check Out",
      hint: balanceDue > 0 ? `Settle ${formatINR(balanceDue)} and close the folio` : "Close the stay and folio",
      icon: LogOut,
      href: checkOutHref(booking),
      tone: "primary",
    },
    isReserved && {
      key: "check-in",
      label: "Check In",
      hint: booking.roomNo ? `Assign Room ${booking.roomNo} and start the stay` : "Assign a room and start the stay",
      icon: LogIn,
      href: checkInHref(booking),
      tone: "primary",
    },
    isInHouse && {
      key: "transfer",
      label: "Room Transfer",
      hint: `Move out of Room ${booking.roomNo || "—"}`,
      icon: ArrowRightLeft,
      onClick: () => setDrawer("transfer"),
    },
    !isClosed && {
      key: "extend",
      label: "Extend Stay",
      hint: `Currently checks out ${booking.checkOut}`,
      icon: CalendarPlus,
      onClick: () => setDrawer("extend"),
    },
    canAddPayment && {
      key: "payment",
      label: isReserved ? "Collect Advance" : "Add Payment",
      hint: balanceDue > 0 ? `${formatINR(balanceDue)} outstanding` : "Record a payment on the folio",
      icon: Wallet,
      onClick: () => void openPayment(),
      disabled: openingPayment,
    },
    canAddCharge && {
      key: "charge",
      label: "Add Charge",
      hint: "Mini bar, laundry, F&B, misc.",
      icon: PlusCircle,
      onClick: () => setDrawer("charge"),
    },
    !isVoided && {
      key: "edit",
      label: "Edit Reservation",
      hint: booking.status === "Checked Out" ? "Booking type, source, notes" : "Dates, room, tariff, notes",
      icon: Pencil,
      href: editReservationHref,
    },
    Boolean(booking.guestId) && {
      key: "guest",
      label: "Edit Guest Details",
      hint: "Contact, ID proof, address",
      icon: UserCog,
      href: guestProfileHref({ id: booking.guestId! }, { edit: true }),
    },
    Boolean(folio) && {
      key: "folio",
      label: "View Folio",
      hint: folio?.folioNumber ?? "Open folio ledger",
      icon: Receipt,
      href: folio ? guestFolioHref(folio) : "#",
    },
    isReserved && isNoShowEligible(booking) && !booking.groupId && {
      key: "no-show",
      label: "Mark No Show",
      hint: "Guest did not arrive — release the room",
      icon: UserX,
      onClick: () => setConfirm("no-show"),
      tone: "warning",
    },
    isReserved && {
      key: "cancel",
      label: "Cancel Booking",
      hint: "Release the room and void the booking",
      icon: XCircle,
      onClick: () => setConfirm("cancel"),
      tone: "danger",
    },
  ].filter(Boolean) as BookingAction[];
  const address = [booking.address, booking.city, booking.state, booking.country, booking.pincode]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}

      <Link href={ALL_BOOKINGS_HREF} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All Bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white shadow-md">
            {getInitials(booking.guestName ?? "G")}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-slate-900">{booking.guestName || "Guest"}</h1>
              <ReservationStatusBadge status={booking.status} />
              {booking.arrivingToday && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Arriving today
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {displayBookingNo(booking)}
              {booking.guestNo && booking.guestId ? (
                <>
                  {" · "}
                  <RefLink href={guestProfileHref({ id: booking.guestId })}>{booking.guestNo}</RefLink>
                </>
              ) : booking.guestNo ? (
                ` · ${booking.guestNo}`
              ) : null}
              {folio?.folioNumber && (
                <>
                  {" · "}
                  <RefLink href={guestFolioHref(folio)}>{folio.folioNumber}</RefLink>
                </>
              )}
              {booking.source ? ` · ${booking.source}` : ""}
            </p>
            {booking.groupId && (
              <Link
                href={`/frontoffice/group-booking/${booking.groupId}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <Users className="h-3 w-3" />
                Group {booking.groupNo || booking.groupName}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              if (!printBookingDetail(booking, propertyName)) {
                setToast({ message: "Unable to open print dialog. Allow pop-ups and try again.", variant: "error" });
              }
            }}
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          {isInHouse ? (
            <Link href={checkOutHref(booking)}>
              <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <LogOut className="h-3.5 w-3.5" /> Check Out
              </Button>
            </Link>
          ) : !isClosed ? (
            <Link href={checkInHref(booking)}>
              <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
                <LogIn className="h-3.5 w-3.5" /> Check In
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Stay at a glance */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile icon={Calendar} label="Check-in" value={booking.checkIn} />
        <Tile icon={Calendar} label="Check-out" value={booking.checkOut} />
        <Tile icon={Moon} label="Nights" value={nights} />
        <Tile icon={BedDouble} label="Room" value={`${booking.roomNo || "TBA"}${booking.roomType ? ` · ${booking.roomType}` : ""}`} />
        <Tile icon={Users} label="Guests" value={`${booking.adults ?? 1} A · ${booking.children ?? 0} C`} />
        <Tile
          icon={Wallet}
          label="Balance"
          value={formatINR(balanceDue)}
          tone={balanceDue > 0 ? "amber" : "emerald"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Guest information" icon={User}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Guest name" value={booking.guestName} />
              <Field
                label="Guest profile"
                value={
                  booking.guestNo && booking.guestId ? (
                    <RefLink href={guestProfileHref({ id: booking.guestId })}>{booking.guestNo}</RefLink>
                  ) : (
                    booking.guestNo
                  )
                }
              />
              <Field label="Mobile" value={booking.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" />{booking.phone}</span>} />
              <Field label="Email" value={booking.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" />{booking.email}</span>} />
              <Field label="Gender" value={booking.gender} />
              <Field label="Date of birth" value={booking.dob} />
              <Field label="Nationality" value={booking.nationality} />
              <Field
                label="ID proof"
                value={booking.idProofType && `${booking.idProofType}${booking.idNumber ? ` · ${booking.idNumber}` : ""}`}
              />
              <Field label="Booking type" value={booking.bookingType} />
              {booking.companyName && (
                <Field label="Company" value={<span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-slate-400" />{booking.companyName}</span>} />
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Address" value={address && <span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />{address}</span>} />
              </div>
            </div>
          </Card>

          <Card title="Stay details" icon={BedDouble}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Check-in" value={booking.checkIn} />
              <Field label="Check-out" value={booking.checkOut} />
              <Field label="Nights" value={nights} />
              <Field label="Room" value={booking.roomNo || "TBA"} />
              <Field label="Room type" value={booking.roomType} />
              <Field label="Adults / Children" value={`${booking.adults ?? 1} / ${booking.children ?? 0}`} />
              <Field label="Tariff plan" value={booking.tariffPlan} />
              <Field label="Meal plan" value={booking.mealPlan && <span className="inline-flex items-center gap-1"><Utensils className="h-3 w-3 text-slate-400" />{booking.mealPlan}</span>} />
              <Field label="Source" value={booking.source} />
            </div>
          </Card>

          <Card title={`Guests on this booking${guests.length ? ` (${guests.length})` : ""}`} icon={Users}>
            {guests.length === 0 ? (
              <p className="text-sm text-slate-500">
                {isInHouse || booking.status === "Checked Out"
                  ? "No guest list recorded for this stay."
                  : "Guests are recorded at check-in."}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {guests.map((g) => {
                  const name = g.guestName ?? g.guest?.name ?? "Guest";
                  const mobile = g.mobile ?? g.guest?.mobile;
                  const email = g.email ?? g.guest?.email;
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {getInitials(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {name}
                            {g.guestNo ? (
                              <span className="ml-1.5 text-xs font-normal">
                                {g.guestId ? (
                                  <RefLink href={guestProfileHref({ id: g.guestId })}>{g.guestNo}</RefLink>
                                ) : (
                                  <span className="text-slate-400">{g.guestNo}</span>
                                )}
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {[mobile, email].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          String(g.role).toUpperCase() === "PRIMARY"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {String(g.role).toUpperCase() === "PRIMARY" ? "Primary" : "Companion"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Folio" icon={Receipt}>
            {!folio ? (
              <p className="text-sm text-slate-500">No folio has been opened for this booking yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 sm:gap-x-8">
                    <Field
                      label="Folio no."
                      value={<RefLink href={guestFolioHref(folio)}>{folio.folioNumber || "View"}</RefLink>}
                    />
                    <Field
                      label="Status"
                      value={
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            folio.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600",
                          )}
                        >
                          {folio.status}
                        </span>
                      }
                    />
                    <Field label="Opened" value={formatActivityDate(folio.openedAt)} />
                    <Field
                      label="Closed"
                      value={folio.closedAt ? formatActivityDate(folio.closedAt) : undefined}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Charges", value: Number(folio.subtotal ?? 0) + Number(folio.taxTotal ?? 0) },
                    { label: "Discount", value: Number(folio.discountTotal ?? 0) },
                    { label: "Paid", value: Number(folio.paidAmount ?? 0), tone: "text-emerald-700" },
                    {
                      label: "Balance",
                      value: Number(folio.balanceAmount ?? 0),
                      tone: Number(folio.balanceAmount ?? 0) > 0 ? "text-amber-600" : "text-emerald-700",
                    },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-slate-200 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase text-slate-400">{s.label}</p>
                      <p className={cn("text-sm font-bold text-slate-900", s.tone)}>{formatINR(s.value)}</p>
                    </div>
                  ))}
                </div>

                {folioLedger.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nothing posted to this folio yet.
                    {canAddCharge ? " Use Add Charge or Add Payment above." : ""}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                          <th className="px-3 py-2 text-left font-medium">Description</th>
                          <th className="px-3 py-2 text-right font-medium">Debit</th>
                          <th className="px-3 py-2 text-right font-medium">Credit</th>
                          <th className="px-3 py-2 text-right font-medium">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {folioLedger.map((row) => (
                          <tr key={row.id}>
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                              {row.date && row.date !== "~" ? formatActivityDate(row.date) : "—"}
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-900">{row.label}</p>
                              {(row.detail || row.ref) && (
                                <p className="text-xs text-slate-500">
                                  {[row.detail, row.ref].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-slate-900">
                              {row.debit ? formatINR(row.debit) : ""}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right text-emerald-600">
                              {row.credit ? formatINR(row.credit) : ""}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-900">
                              {formatINR(row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 text-sm font-semibold">
                        <tr>
                          <td className="px-3 py-2" colSpan={2}>Balance due</td>
                          <td className="px-3 py-2 text-right">
                            {formatINR(folioLedger.reduce((s, l) => s + l.debit, 0))}
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-600">
                            {formatINR(folioLedger.reduce((s, l) => s + l.credit, 0))}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right",
                              Number(folio.balanceAmount ?? 0) > 0 ? "text-amber-600" : "text-emerald-700",
                            )}
                          >
                            {formatINR(Number(folio.balanceAmount ?? 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>

          {booking.specialRequests && (
            <Card title="Special requests" icon={Pencil}>
              <p className="whitespace-pre-wrap rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {booking.specialRequests}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:pb-1">
          <Card title="Actions" icon={Zap}>
            <div className="space-y-1.5">
              {actions.map((a) => (
                <ActionRow key={a.key} action={a} />
              ))}
            </div>
          </Card>

          <Card title="ID documents" icon={FileText}>
            {(booking.idProofType || booking.idNumber) && (
              <p className="mb-2 text-xs text-slate-500">
                {booking.idProofType || "ID"}
                {booking.idNumber ? ` · ${booking.idNumber}` : ""}
              </p>
            )}
            <GuestDocumentsPanel
              guestId={booking.guestId}
              reservationId={booking.id}
              documentType={booking.idProofType}
              allowUpload={!VOIDED_STATUSES.has(booking.status)}
              compact
              emptyText="No ID document uploaded."
            />
          </Card>

          <Card title="Payment summary" icon={Wallet}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Room rate × {nights} night{nights !== 1 ? "s" : ""}</span>
                <span>{formatINR(roomRate)} × {nights}</span>
              </div>
              {folio ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Folio charges</span>
                    <span>{formatINR(Number(folio.subtotal ?? 0))}</span>
                  </div>
                  {Number(folio.taxTotal ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span>{formatINR(Number(folio.taxTotal))}</span>
                    </div>
                  )}
                  {Number(folio.discountTotal ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount</span>
                      <span>− {formatINR(Number(folio.discountTotal))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Total amount</span>
                    <span>{formatINR(Number(folio.totalAmount ?? 0))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid</span>
                    <span>− {formatINR(Number(folio.paidAmount ?? 0))}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Total amount</span>
                    <span>{formatINR(total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Advance paid{booking.paymentMode ? ` (${booking.paymentMode})` : ""}</span>
                    <span>− {formatINR(advance)}</span>
                  </div>
                </>
              )}
              {booking.externalReference && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Advance reference</span>
                  <span className="font-mono">{booking.externalReference}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Balance due</span>
                <span className={cn("text-lg font-bold", balanceDue > 0 ? "text-amber-600" : "text-emerald-600")}>
                  {formatINR(balanceDue)}
                </span>
              </div>
              {folio?.folioNumber && (
                <p className="text-right text-xs text-slate-400">
                  <RefLink href={guestFolioHref(folio)}>Folio {folio.folioNumber}</RefLink>
                  {folio.status !== "OPEN" ? ` · ${folio.status.toLowerCase()}` : ""}
                </p>
              )}
            </div>
          </Card>

          <Card title="Booking info" icon={Hash}>
            <div className="space-y-3">
              <Field label="Booking no." value={<span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3 text-slate-400" />{displayBookingNo(booking)}</span>} />
              <Field
                label="Guest profile"
                value={
                  booking.guestNo && booking.guestId ? (
                    <RefLink href={guestProfileHref({ id: booking.guestId })}>{booking.guestNo}</RefLink>
                  ) : (
                    booking.guestNo
                  )
                }
              />
              <Field
                label="Folio"
                value={
                  folio ? (
                    <span className="inline-flex items-center gap-1.5">
                      <RefLink href={guestFolioHref(folio)}>{folio.folioNumber || "View folio"}</RefLink>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {folio.status}
                      </span>
                    </span>
                  ) : undefined
                }
              />
              <Field label="Status" value={booking.status} />
              <Field label="Created" value={booking.createdAt} />
              <Field label="Booked by" value={booking.bookedBy} />
              {booking.groupId && <Field label="Group" value={booking.groupName || booking.groupNo} />}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runStatusChange()}
        loading={saving}
        title={confirm === "cancel" ? "Cancel Reservation" : "Mark as No Show"}
        message={
          confirm === "cancel"
            ? `Are you sure you want to cancel booking ${displayBookingNo(booking)} for ${booking.guestName ?? "this guest"}? This action cannot be undone.`
            : `Guest did not arrive for booking ${displayBookingNo(booking)}. The reservation will be marked as No Show and the room will be released.`
        }
        confirmLabel={confirm === "cancel" ? "Cancel Booking" : "Mark No Show"}
        variant="danger"
      />

      {drawer === "transfer" && (
        <BookingRoomTransferDrawer
          booking={booking}
          onClose={() => setDrawer(null)}
          onTransferred={(toRoom) =>
            afterAction(`${booking.guestName ?? "Guest"} moved from Room ${booking.roomNo || "TBA"} to Room ${toRoom}.`)
          }
        />
      )}

      {drawer === "extend" && (
        <BookingExtendStayDrawer
          booking={booking}
          onClose={() => setDrawer(null)}
          onExtended={(checkOut, extraNights) =>
            afterAction(
              `Stay extended by ${extraNights} night${extraNights !== 1 ? "s" : ""} — new check-out ${checkOut}.`,
            )
          }
        />
      )}

      {drawer === "charge" && (
        <BookingAddChargeDrawer
          booking={booking}
          onClose={() => setDrawer(null)}
          onPosted={(amount) => afterAction(`Charge of ${formatINR(amount)} posted to the folio.`)}
        />
      )}

      <CollectPaymentDrawer
        folio={folio ? { ...folio, guestName: folio.guestName ?? booking.guestName, room: folio.room ?? booking.roomNo } : null}
        open={drawer === "payment"}
        onClose={() => setDrawer(null)}
        onSuccess={(txn) =>
          afterAction(`Payment of ${formatINR(txn.amount)} recorded · ${txn.transactionNumber}`)
        }
      />
    </div>
  );
}
