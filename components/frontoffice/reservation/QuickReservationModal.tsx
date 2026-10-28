"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  Loader2,
  Mail,
  Search,
  Smartphone,
  Tag,
  User,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { GuestProfileSearchSelect } from "@/components/frontoffice/GuestProfileSearchSelect";
import { currentUser } from "@/app/data";
import {
  mealPlans,
  paymentModes,
  reservationPaymentModesNeedingExternalRef,
} from "@/app/data/frontoffice/constants";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import type { RoomStatusCard } from "@/app/data/frontoffice/modules";
import type { ReservationBooking, ReservationStatus } from "@/app/data/types";
import type { TariffPlanMaster, RoomTypeMaster } from "@/app/data/frontoffice/masters";
import {
  guestService,
  reservationService,
  roomService,
  roomTypeService,
  tariffPlanService,
} from "@/services/front-office";
import { findGuestByEmail, findGuestByMobile } from "@/components/frontoffice/guestFormUtils";
import { formatINR } from "@/components/frontoffice/ui";
import { checkInHref } from "@/lib/check-in-navigation";
import { cn } from "@/lib/utils";

export type QuickReservationDraft = {
  room: string;
  type: string;
  floor: string;
  bedType?: string;
  maxOccupancy?: number;
  checkIn: string;
  checkOut: string;
  days: string[];
};

export type QuickReservationModalProps = {
  draft: QuickReservationDraft | null;
  conflict?: string | null;
  /** Shown while availability for the chosen dates is loading or could not be checked; blocks saving. */
  availabilityNote?: string | null;
  /** Other rooms of the same type that are free for every night of the draft. */
  roomOptions?: string[];
  todayIso: string;
  onDatesChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
  onCreated: (booking: ReservationBooking) => void;
};

type SaveAction = "temp" | "reserve" | "checkin";

const TITLES = ["Mr", "Mrs", "Ms", "Dr"] as const;
const FALLBACK_RATES: Record<string, number> = { BAR: 3500, Corporate: 3200, Weekend: 4800, "Long Stay": 3000 };

function formatShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shiftDate(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickReservationModal(props: QuickReservationModalProps) {
  if (!props.draft) return null;
  return (
    <QuickReservationDialog
      key={props.draft.room}
      {...props}
      draft={props.draft}
    />
  );
}

function QuickReservationDialog({
  draft,
  conflict,
  availabilityNote,
  roomOptions,
  todayIso,
  onDatesChange,
  onClose,
  onCreated,
}: QuickReservationModalProps & { draft: QuickReservationDraft }) {
  const router = useRouter();
  const nights = draft.days.length;

  const [plans, setPlans] = useState<TariffPlanMaster[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeMaster[]>([]);
  const [roomCards, setRoomCards] = useState<RoomStatusCard[]>([]);
  const [guests, setGuests] = useState<GuestProfile[]>([]);

  const [room, setRoom] = useState(draft.room);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [planKey, setPlanKey] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [title, setTitle] = useState<string>("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pickedGuest, setPickedGuest] = useState<GuestProfile | null>(null);
  const [guestQuery, setGuestQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [depositOpen, setDepositOpen] = useState(false);
  const [advance, setAdvance] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [externalRef, setExternalRef] = useState("");

  const [saving, setSaving] = useState<SaveAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      tariffPlanService.list().catch(() => [] as TariffPlanMaster[]),
      roomTypeService.list().catch(() => [] as RoomTypeMaster[]),
      roomService.status().catch(() => [] as RoomStatusCard[]),
      guestService.list().catch(() => [] as GuestProfile[]),
    ]).then(([p, rt, rc, g]) => {
      if (cancelled) return;
      setPlans(p.filter((x) => x.status !== "Inactive"));
      setRoomTypes(rt);
      setRoomCards(rc);
      setGuests(g);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const planOptions = useMemo(() => {
    const forType = plans.filter(
      (p) => !p.roomType || p.roomType.toLowerCase() === draft.type.toLowerCase(),
    );
    const list = forType.length > 0 ? forType : plans;
    if (list.length === 0) {
      return Object.entries(FALLBACK_RATES).map(([name, rate]) => ({ key: name, label: name, rate, mealPlan: "" }));
    }
    return list.map((p) => ({
      key: p.name || p.code,
      label: p.name || p.code,
      rate: p.baseRate || 0,
      mealPlan: p.mealPlan,
    }));
  }, [plans, draft.type]);

  const rooms = useMemo(() => {
    const set = new Set([draft.room, ...(roomOptions ?? [])]);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [draft.room, roomOptions]);

  const activePlanKey = planKey || planOptions[0]?.key || "";
  const activePlan = planOptions.find((p) => p.key === activePlanKey);
  const typeBaseRate = roomTypes.find((t) => t.name === draft.type)?.baseRate ?? 0;
  const roomRate = activePlan?.rate || typeBaseRate;
  const totalAmount = roomRate * nights;
  const activeMealPlan = mealPlan || activePlan?.mealPlan || "EP";
  const advanceAmount = Math.max(0, Number(advance) || 0);
  const needsRef = reservationPaymentModesNeedingExternalRef.has(paymentMode);

  const matchedGuest = useMemo(
    () => findGuestByMobile(guests, mobile) ?? findGuestByEmail(guests, email),
    [guests, mobile, email],
  );

  const maxGuests = draft.maxOccupancy && draft.maxOccupancy > 0 ? draft.maxOccupancy : 6;
  const canCheckIn = draft.checkIn === todayIso;
  const roomConflict =
    availabilityNote ??
    (room === draft.room
      ? conflict
      : rooms.includes(room)
        ? null
        : `Room ${room} is not free for these dates.`);
  const disabled = Boolean(roomConflict) || nights === 0 || saving !== null;

  const changeCheckIn = (value: string) => {
    if (!value || value < todayIso) return;
    onDatesChange(value, shiftDate(value, Math.max(1, nights)));
  };
  const changeCheckOut = (value: string) => {
    if (!value || value <= draft.checkIn) return;
    onDatesChange(draft.checkIn, value);
  };

  const fullFormHref = (mode?: "group") => {
    const params = new URLSearchParams({
      room,
      roomType: draft.type,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
    });
    if (mode) params.set("mode", mode);
    return `/frontoffice/reservation/new?${params.toString()}`;
  };

  const save = async (action: SaveAction) => {
    if (disabled) return;
    if (!pickedGuest) {
      if (!firstName.trim()) return setError("First name is required.");
      if (mobile.replace(/\D/g, "").length < 10) return setError("Enter a valid 10-digit phone number.");
      if (matchedGuest) {
        return setError(`${matchedGuest.name} already has a profile with this phone or email — use that profile.`);
      }
    }
    if (advanceAmount > 0) {
      if (!paymentMode) return setError("Select a payment mode for the deposit.");
      if (needsRef && !externalRef.trim()) return setError(`Enter the ${paymentMode} reference for the deposit.`);
      if (advanceAmount > totalAmount) return setError("Deposit cannot be more than the total amount.");
    }
    setError(null);
    setSaving(action);
    try {
      let guestId = pickedGuest?.id;
      if (!guestId) {
        const created = await guestService.create({
          name: `${firstName} ${lastName}`.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          gender: title === "Mr" ? "Male" : title === "Mrs" || title === "Ms" ? "Female" : "",
          nationality: "Indian",
          loyaltyPoints: 100,
          memberSince: new Date().toLocaleString("en-IN", { month: "short", year: "numeric" }),
          preferences: [],
        });
        guestId = created.id;
      }
      const status: ReservationStatus = action === "temp" ? "Reserved" : "Confirmed";
      const booking = await reservationService.create({
        guestId,
        roomRefId: roomCards.find((r) => r.roomNo === room)?.id ?? room,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        nights,
        adults,
        children,
        tariffPlan: activePlanKey || "BAR",
        mealPlan: activeMealPlan,
        roomRate,
        totalAmount,
        advancePaid: advanceAmount,
        paymentMode: advanceAmount > 0 ? paymentMode : undefined,
        externalReference: advanceAmount > 0 && externalRef.trim() ? externalRef.trim() : undefined,
        balance: Math.max(0, totalAmount - advanceAmount),
        bookingType: "Individual",
        status,
        bookedBy: currentUser.name,
      });
      if (action === "checkin") {
        router.push(checkInHref(booking));
        return;
      }
      onCreated(booking);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create reservation");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close quick reservation"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-slate-800 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Add Quick Reservation</h2>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-slate-900">
              {nights} Night{nights !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-5 py-4">
          {/* Row 1: dates · room type · room · price */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 text-xl font-bold text-sky-800">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              <DatePick label="Check-in date" value={draft.checkIn} min={todayIso} onChange={changeCheckIn} />
              <span>–</span>
              <DatePick
                label="Check-out date"
                value={draft.checkOut}
                min={shiftDate(draft.checkIn, 1)}
                onChange={changeCheckOut}
              />
            </div>
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-600">
              <BedDouble className="h-5 w-5 text-slate-500" />
              {draft.type}
            </p>
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Room</span>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={cn(lineCls, "w-28 font-semibold")}
              >
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold tabular-nums text-emerald-700">{formatINR(totalAmount)}</p>
              <p className="text-xs text-slate-500">({formatINR(roomRate)} / night)</p>
            </div>
          </div>

          {roomConflict && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {roomConflict} {!availabilityNote && rooms.length > 1 ? "Pick another room above." : ""}
            </p>
          )}

          {/* Row 2: occupancy · rate · meal */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[6rem_6rem_1fr_7rem]">
            <IconSelect icon={User} title="Adults" value={adults} onChange={(v) => setAdults(Number(v))}>
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </IconSelect>
            <IconSelect icon={UserRound} title="Children" value={children} onChange={(v) => setChildren(Number(v))}>
              {Array.from({ length: 5 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </IconSelect>
            <IconSelect
              icon={Tag}
              title="Rate plan"
              value={activePlanKey}
              onChange={(v) => {
                setPlanKey(v);
                setMealPlan("");
              }}
              className="col-span-2 sm:col-span-1"
            >
              {planOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} — {formatINR(p.rate || typeBaseRate)}
                </option>
              ))}
            </IconSelect>
            <IconSelect
              icon={Utensils}
              title="Meal plan"
              value={activeMealPlan}
              onChange={setMealPlan}
              className="col-span-2 sm:col-span-1"
            >
              {mealPlans.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </IconSelect>
          </div>

          {/* Row 3+: guest | deposit */}
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <div className="space-y-3">
              {pickedGuest ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {pickedGuest.name}
                      {pickedGuest.guestNo ? (
                        <span className="ml-2 font-mono text-[11px] font-normal text-slate-500">
                          {pickedGuest.guestNo}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {[pickedGuest.mobile, pickedGuest.email].filter(Boolean).join(" · ") || "No contact details"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickedGuest(null);
                      setGuestQuery("");
                    }}
                    className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : searchOpen ? (
                <div className="flex items-center gap-2">
                  <GuestProfileSearchSelect
                    value={guestQuery}
                    onChange={setGuestQuery}
                    onSelectGuest={(g) => {
                      setPickedGuest(g);
                      setSearchOpen(false);
                      setError(null);
                    }}
                    placeholder="Search guest by name, phone or email…"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="shrink-0 text-xs font-semibold text-slate-500 hover:underline"
                  >
                    New guest
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-3">
                    <select value={title} onChange={(e) => setTitle(e.target.value)} className={lineCls} aria-label="Title">
                      {TITLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name *"
                      className={lineCls}
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className={lineCls}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Phone *"
                        inputMode="tel"
                        className={cn(lineCls, "pl-5")}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        className={cn(lineCls, "pl-5")}
                      />
                    </div>
                  </div>
                  {matchedGuest ? (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                      <span className="text-amber-900">
                        Existing guest: <strong>{matchedGuest.name}</strong>
                        {matchedGuest.mobile ? ` · ${matchedGuest.mobile}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickedGuest(matchedGuest)}
                        className="shrink-0 font-semibold text-amber-800 hover:underline"
                      >
                        Use profile
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                    >
                      <Search className="h-3 w-3" /> Search existing guest
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2 sm:text-right">
              <button
                type="button"
                onClick={() => setDepositOpen((v) => !v)}
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                Guarantee / Deposit
              </button>
              {depositOpen && (
                <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2.5 text-left">
                  <input
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="Deposit amount"
                    inputMode="decimal"
                    className={lineCls}
                  />
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={lineCls}>
                    <option value="">Payment mode</option>
                    {paymentModes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {needsRef && (
                    <input
                      value={externalRef}
                      onChange={(e) => setExternalRef(e.target.value)}
                      placeholder={paymentMode === "UPI" ? "UPI transaction ID" : "Card auth / reference"}
                      className={lineCls}
                    />
                  )}
                  {advanceAmount > 0 && (
                    <p className="text-[11px] text-slate-500">
                      Balance: <strong>{formatINR(Math.max(0, totalAmount - advanceAmount))}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-100 px-5 py-3">
          <FooterButton
            onClick={() => void save("temp")}
            disabled={disabled}
            loading={saving === "temp"}
            className="bg-blue-600 text-white hover:bg-blue-700"
            title="Save as a tentative reservation (status Reserved)"
          >
            Temp Reserve
          </FooterButton>
          <FooterButton
            onClick={() => void save("reserve")}
            disabled={disabled}
            loading={saving === "reserve"}
            className="bg-amber-400 text-slate-900 hover:bg-amber-500"
            title="Save as a confirmed reservation"
          >
            Reserve
          </FooterButton>
          <FooterButton
            onClick={() => void save("checkin")}
            disabled={disabled || !canCheckIn}
            loading={saving === "checkin"}
            className="border border-sky-300 bg-white text-sky-700 hover:bg-sky-50"
            title={canCheckIn ? "Confirm and go to check-in" : "Check-in is only possible for today's arrivals"}
          >
            Check-In / Walk-In
          </FooterButton>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link href={fullFormHref()} className="font-medium text-sky-700 hover:underline">
              Single
            </Link>
            <span className="text-slate-300">|</span>
            <Link href={fullFormHref("group")} className="font-medium text-sky-700 hover:underline">
              Group
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const lineCls =
  "h-9 w-full border-0 border-b border-slate-300 bg-transparent px-0 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-0";

function IconSelect({
  icon: Icon,
  title,
  value,
  onChange,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2 border-b border-slate-300", className)} title={title}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-700">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
        className="h-9 w-full min-w-0 border-0 bg-transparent px-0 text-sm text-slate-900 focus:outline-none focus:ring-0"
      >
        {children}
      </select>
    </label>
  );
}

function DatePick({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className="relative cursor-pointer rounded border-b border-dashed border-sky-300 px-0.5 hover:border-sky-600 hover:bg-sky-50"
      title={`Change ${label.toLowerCase()}`}
    >
      {formatShort(value)}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* browser opens its own picker */
          }
        }}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function FooterButton({
  children,
  onClick,
  disabled,
  loading,
  className,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
