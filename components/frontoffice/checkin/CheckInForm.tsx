"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Crown,
  KeyRound,
  Phone,
  Search,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { CompanySearchSelect } from "@/components/frontoffice/CompanySearchSelect";
import type { ReservationBooking } from "@/app/data/types/frontoffice";
import {
  guestService,
  reservationService,
  roomService,
  roomTypeService,
} from "@/services/front-office";
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

import { bookingTypeOptions } from "@/app/data/frontoffice/checkin";

import { GuestDetailsSection } from "./GuestDetailsSection";
import { RoomAssignmentSection } from "./RoomAssignmentSection";
import { PaymentBillingSection } from "./PaymentBillingSection";

const emptyOption = (label: string) => (
  <option value="" disabled hidden>
    {label}
  </option>
);

type CheckInMode = "reserved" | "walkin";

const inputClass = "rounded-xl";

const defaultWalkIn = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  bookingType: "" as "" | "Individual" | "Company",
  companyName: "",
  companyId: "",
  roomType: "",
  room: "",
  adults: 1,
  nights: 1,
  paymentMode: "Cash",
};

function generateWalkInRef() {
  return `WI-${String(Date.now()).slice(-6)}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isArrivingToday(b: {
  checkIn?: string;
  arrivingToday?: boolean;
}) {
  if (b.arrivingToday) return true;
  const checkIn = String(b.checkIn ?? "");
  if (!checkIn) return false;
  const today = todayIso();
  const displayToday = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    checkIn === today ||
    checkIn.startsWith(today) ||
    checkIn.includes(displayToday)
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function formatStayDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CheckInForm() {
  const [checkInMode, setCheckInMode] = useState<CheckInMode>("reserved");
  const [bookingId, setBookingId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [booking, setBooking] = useState<ReservationBooking | null>(null);
  const [walkInRef, setWalkInRef] = useState(generateWalkInRef);
  const [walkIn, setWalkIn] = useState({ ...defaultWalkIn });
  const [assignedRoom, setAssignedRoom] = useState("");
  const [keyCard, setKeyCard] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [vehicle, setVehicle] = useState("");
  const [remarks, setRemarks] = useState("");
  const [idFile, setIdFile] = useState("");
  const [guestDetails, setGuestDetails] = useState({
    gender: "",
    dob: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    idProofType: "",
    idNumber: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [pmsBookings, setPmsBookings] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<
    { roomNo: string; roomType: string; status: string; housekeeping: string }[]
  >([]);
  const [roomTypeRates, setRoomTypeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, rooms, roomTypes] = await Promise.all([
          reservationService.list(),
          roomService.list(),
          roomTypeService.list().catch(() => []),
        ]);
        if (cancelled) return;
        setPmsBookings(bookings);
        const sellable = rooms.filter((r) => {
          const status = String(r.status || "").toLowerCase();
          const hk = String(r.housekeeping || "").toLowerCase();
          const vacant =
            status.includes("vacant") ||
            status.includes("available") ||
            status === "clean" ||
            !r.guestName;
          const ready =
            !hk ||
            hk.includes("clean") ||
            hk.includes("inspect") ||
            hk.includes("ready");
          return vacant && ready;
        });
        setAvailableRooms(
          (sellable.length > 0 ? sellable : rooms).map((r) => ({
            roomNo: r.roomNo,
            roomType: r.roomType,
            status: r.status,
            housekeeping: r.housekeeping,
          })),
        );
        const rates: Record<string, number> = {};
        for (const rt of roomTypes) {
          if (rt.name) rates[rt.name] = rt.baseRate || 0;
          if (rt.code) rates[rt.code] = rt.baseRate || 0;
        }
        setRoomTypeRates(rates);
      } catch {
        if (!cancelled) {
          setPmsBookings([]);
          setAvailableRooms([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const arrivalsToday = useMemo(
    () =>
      pmsBookings.filter(
        (b) =>
          b.status !== "Checked In" &&
          b.status !== "Cancelled" &&
          b.status !== "Checked Out" &&
          isArrivingToday(b),
      ),
    [pmsBookings],
  );

  const walkInRate = roomTypeRates[walkIn.roomType] ?? 0;
  const walkInTotal = walkInRate * walkIn.nights * walkIn.adults;
  const walkInGuestName =
    [walkIn.firstName, walkIn.lastName].filter(Boolean).join(" ") || "Guest";

  const activeGuestName =
    checkInMode === "reserved"
      ? (booking?.guestName ?? "Guest")
      : walkInGuestName;

  const handleGuestDetailChange = (key: string, value: string) => {
    setGuestDetails((prev) => ({ ...prev, [key]: value }));
  };

  const loadArrival = (found: any) => {
    setBooking(found);
    setBookingId(found.id);
    setAssignedRoom(found.assignedRoom || found.roomNo || "");
    setDeposit(found.advancePaid || 0);
    setLookupError("");
    setToast(`Loaded booking reference ${found.id} for ${found.guestName}.`);
  };

  const handleLookupBooking = (idToSearch?: string) => {
    const query = (idToSearch ?? bookingId).trim();
    if (!query) {
      setLookupError("Please enter or select a reservation reference number.");
      return;
    }

    const pool =
      arrivalsToday.length > 0
        ? arrivalsToday
        : pmsBookings.filter(
            (b) =>
              b.status !== "Checked In" &&
              b.status !== "Cancelled" &&
              b.status !== "Checked Out",
          );

    const found = pool.find(
      (b) =>
        b.id.toLowerCase() === query.toLowerCase() ||
        b.guestName.toLowerCase().includes(query.toLowerCase()),
    );

    if (found) {
      loadArrival(found);
    } else {
      setLookupError(
        `No active arrival found matching "${query}". Try another ID or switch to Walk-in.`,
      );
    }
  };

  const handleCompleteCheckIn = async () => {
    const guestNameForApi =
      checkInMode === "reserved"
        ? (booking?.guestName ?? "Guest")
        : walkInGuestName;
    const roomForApi =
      checkInMode === "reserved"
        ? assignedRoom
        : walkIn.room || assignedRoom;

    try {
      if (checkInMode === "reserved" && booking) {
        await reservationService.checkIn(booking.id, {
          roomNo: roomForApi,
        } as Partial<ReservationBooking>);
      } else {
        const created = await reservationService.create({
          guestName: guestNameForApi,
          phone: walkIn.mobile,
          email: walkIn.email || undefined,
          roomNo: roomForApi,
          roomType: walkIn.roomType,
          nights: walkIn.nights,
          adults: walkIn.adults,
          totalAmount: walkInTotal,
          advancePaid: deposit,
          paymentMode: walkIn.paymentMode,
          status: "Confirmed",
          source: "Walk-in",
        } as Partial<ReservationBooking>);
        await reservationService.checkIn(created.id, {
          roomNo: roomForApi,
        } as Partial<ReservationBooking>);
        await guestService.create({
          name: guestNameForApi,
          email: walkIn.email || undefined,
          mobile: walkIn.mobile || undefined,
        });
      }

      setCompleted(true);
      setToast(
        `Check-in completed successfully for ${guestNameForApi} in Room ${roomForApi}!`,
      );
    } catch (e) {
      setToast(
        e instanceof Error ? e.message : "Failed to complete check-in.",
      );
    }
  };

  const availableRoomNumbers = useMemo(() => {
    const type = walkIn.roomType || booking?.roomType;
    const rooms = type
      ? availableRooms.filter(
          (r) =>
            !type ||
            r.roomType?.toLowerCase() === type.toLowerCase() ||
            r.roomType?.toLowerCase().includes(type.toLowerCase()),
        )
      : availableRooms;
    const list = (rooms.length > 0 ? rooms : availableRooms).map((r) => r.roomNo);
    if (assignedRoom && !list.includes(assignedRoom)) list.unshift(assignedRoom);
    return list;
  }, [availableRooms, walkIn.roomType, booking?.roomType, assignedRoom]);

  return (
    <div className="space-y-6 select-none">
      {toast && (
        <AlertBanner
          variant="success"
          message={toast}
          onDismiss={() => setToast(null)}
        />
      )}
      <FOPageHeader
        eyebrow="Front Office"
        title="Guest Check-In Desk"
        description="Process arrivals for reserved bookings or instant walk-in guests."
        badge={
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5">
            <Users className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">
                Arriving today
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {arrivalsToday.length} guest
                {arrivalsToday.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        }
      />

      <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setCheckInMode("reserved")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            checkInMode === "reserved"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Reserved Arrival Check-In
        </button>
        <button
          type="button"
          onClick={() => {
            setCheckInMode("walkin");
            setBooking(null);
            setLookupError("");
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            checkInMode === "walkin"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          <Zap className="h-4 w-4 text-amber-500" />
          Instant Walk-In Registration
        </button>
      </div>

      {completed ? (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
          <h2 className="text-xl font-extrabold text-slate-900">
            Check-In Completed!
          </h2>
          <p className="text-sm text-slate-600">
            {activeGuestName} has been assigned to{" "}
            <strong>
              Room{" "}
              {checkInMode === "reserved" ? assignedRoom : walkIn.room}
            </strong>
            .
          </p>
          <Button
            onClick={() => {
              setCompleted(false);
              setBooking(null);
              setBookingId("");
              setWalkIn({ ...defaultWalkIn });
              setWalkInRef(generateWalkInRef());
            }}
            className="!bg-[#0F8A5F] rounded-xl font-bold text-white"
          >
            Process Next Arrival
          </Button>
        </div>

      ) : checkInMode === "reserved" ? (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          {/* Left — search & arriving list (sticky like Check-Out) */}
          <div className="space-y-5 lg:sticky lg:top-4 lg:col-span-2 lg:self-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Find Guest
                  </p>
                  <p className="text-xs text-slate-500">
                    Booking ID or guest name
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleLookupBooking()
                  }
                  placeholder="e.g. BK-1002 or James Wilson"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <Button
                  onClick={() => handleLookupBooking()}
                  className="h-11 gap-2 bg-emerald-700 hover:bg-emerald-800"
                >
                  Lookup Guest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {lookupError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {lookupError}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-900">
                    Arriving Today
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {arrivalsToday.length}
                </span>
              </div>
              <div className="space-y-2">
                {arrivalsToday.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-500">
                    No expected arrivals for today.
                  </p>
                ) : (
                  arrivalsToday.map((arr) => {
                    const isSelected = booking?.id === arr.id;
                    const roomLabel =
                      arr.roomNo && arr.roomNo !== "TBA"
                        ? `Room ${arr.roomNo}`
                        : arr.roomType || "Room TBA";
                    return (
                      <button
                        key={arr.id}
                        type="button"
                        onClick={() => loadArrival(arr)}
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition-all",
                          isSelected
                            ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                            : "border-white/80 bg-white hover:border-emerald-300 hover:shadow-md",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                              isSelected
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {getInitials(arr.guestName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold text-slate-900">
                                {arr.guestName}
                              </p>
                              {arr.isVip && (
                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {arr.id} · {roomLabel}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                              {arr.roomType}
                              {arr.nights
                                ? ` · ${arr.nights} night${arr.nights === 1 ? "" : "s"}`
                                : ""}
                              {typeof arr.totalAmount === "number"
                                ? ` · ${formatINR(arr.totalAmount)}`
                                : ""}
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

          {/* Right — guest card & registration form */}
          <div className="space-y-5 lg:col-span-3">
                {!booking ? (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <UserCheck className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-700">
                      No guest selected
                    </p>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">
                      Look up a booking or select from arriving today to
                      continue check-in.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white">
                            {getInitials(booking.guestName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-lg font-bold text-slate-900">
                                {booking.guestName}
                              </p>
                              {(booking as { isVip?: boolean }).isVip && (
                                <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{booking.id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBooking(null);
                            setBookingId("");
                            setLookupError("");
                          }}
                          className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600"
                        >
                          Change guest
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          {
                            icon: BedDouble,
                            label: "Room",
                            value: `${assignedRoom || booking.roomNo || "TBA"} · ${booking.roomType}`,
                          },
                          {
                            icon: Calendar,
                            label: "Stay",
                            value: `${booking.checkIn} – ${booking.checkOut}`,
                          },
                          {
                            icon: Phone,
                            label: "Mobile",
                            value: booking.phone || "—",
                          },
                          {
                            icon: CreditCard,
                            label: "Nights",
                            value: `${booking.nights ?? "—"} night${(booking.nights ?? 0) === 1 ? "" : "s"}`,
                          },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-slate-400">
                              <Icon className="h-3 w-3" />
                              {label}
                            </div>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <SectionCard
                      icon={UserCheck}
                      title="Identity & Registration"
                      description="Verify guest identification and address credentials."
                    >
                      <GuestDetailsSection
                        guestDetails={guestDetails}
                        onChange={handleGuestDetailChange}
                        onFileUpload={setIdFile}
                        idFile={idFile}
                      />
                    </SectionCard>

                    <SectionCard
                      icon={KeyRound}
                      title="Room Assignment & Keycard"
                      description="Assign clean ready room and encode keycard RFID."
                    >
                      <RoomAssignmentSection
                        assignedRoom={assignedRoom}
                        onAssignedRoomChange={setAssignedRoom}
                        keyCard={keyCard}
                        onKeyCardChange={setKeyCard}
                        vehicle={vehicle}
                        onVehicleChange={setVehicle}
                        remarks={remarks}
                        onRemarksChange={setRemarks}
                        availableRooms={availableRoomNumbers}
                      />
                    </SectionCard>

                    <SectionCard
                      icon={CreditCard}
                      title="Billing & Deposit Collection"
                      description="Collect advance deposit and confirm payment mode."
                    >
                      <PaymentBillingSection
                        paymentMode="Cash"
                        onPaymentModeChange={() => {}}
                        deposit={deposit}
                        onDepositChange={setDeposit}
                        totalAmount={booking.totalAmount ?? 4500}
                      />
                    </SectionCard>

                    <div className="flex justify-end border-t border-slate-200 pt-4">
                      <Button
                        onClick={handleCompleteCheckIn}
                        className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md"
                      >
                        Complete Check-In Process
                      </Button>
                    </div>
                  </>
                )}
          </div>
        </div>
      ) : (
            <>
              <SectionCard
                icon={User}
                title="Walk-In Guest Details"
                description="Log instant walk-in guest information."
              >
                <FormField label="First Name" required>
                  <TextInput
                    className={inputClass}
                    placeholder="e.g. Rajesh"
                    value={walkIn.firstName}
                    onChange={(e) =>
                      setWalkIn((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Last Name" required>
                  <TextInput
                    className={inputClass}
                    placeholder="e.g. Kumar"
                    value={walkIn.lastName}
                    onChange={(e) =>
                      setWalkIn((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Mobile Phone" required>
                  <TextInput
                    className={inputClass}
                    placeholder="+91 98765 43210"
                    value={walkIn.mobile}
                    onChange={(e) =>
                      setWalkIn((p) => ({ ...p, mobile: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Email Address">
                  <TextInput
                    type="email"
                    className={inputClass}
                    placeholder="guest@example.com"
                    value={walkIn.email}
                    onChange={(e) =>
                      setWalkIn((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Booking Category" required>
                  <SelectInput
                    className={inputClass}
                    value={walkIn.bookingType}
                    onChange={(e) =>
                      setWalkIn((p) => ({
                        ...p,
                        bookingType: e.target.value as any,
                      }))
                    }
                  >
                    {emptyOption("Select type")}
                    {bookingTypeOptions.map((t) => {
                      const idVal = typeof t === "string" ? t : (t as any).id;
                      const labelVal =
                        typeof t === "string" ? t : (t as any).label;
                      return (
                        <option key={idVal} value={idVal}>
                          {labelVal}
                        </option>
                      );
                    })}
                  </SelectInput>
                </FormField>
                {walkIn.bookingType === "Company" && (
                  <FormField label="Company Name">
                    <CompanySearchSelect
                      value={walkIn.companyName}
                      onChange={(val) =>
                        setWalkIn((p) => ({ ...p, companyName: val }))
                      }
                      onSelect={(c) =>
                        setWalkIn((p) => ({
                          ...p,
                          companyName: c.name,
                          companyId: c.id,
                        }))
                      }
                    />
                  </FormField>
                )}
              </SectionCard>

              <SectionCard
                icon={UserCheck}
                title="Identity & Registration"
                description="Verify guest identification and address credentials."
              >
                <GuestDetailsSection
                  guestDetails={guestDetails}
                  onChange={handleGuestDetailChange}
                  onFileUpload={setIdFile}
                  idFile={idFile}
                />
              </SectionCard>

              <SectionCard
                icon={KeyRound}
                title="Room Assignment & Keycard"
                description="Assign clean ready room and encode keycard RFID."
              >
                <RoomAssignmentSection
                  assignedRoom={assignedRoom}
                  onAssignedRoomChange={setAssignedRoom}
                  keyCard={keyCard}
                  onKeyCardChange={setKeyCard}
                  vehicle={vehicle}
                  onVehicleChange={setVehicle}
                  remarks={remarks}
                  onRemarksChange={setRemarks}
                  availableRooms={availableRoomNumbers}
                />
              </SectionCard>

              <SectionCard
                icon={CreditCard}
                title="Billing & Deposit Collection"
                description="Collect advance deposit and confirm payment mode."
              >
                <PaymentBillingSection
                  paymentMode={walkIn.paymentMode}
                  onPaymentModeChange={(val) =>
                    setWalkIn((p) => ({ ...p, paymentMode: val }))
                  }
                  deposit={deposit}
                  onDepositChange={setDeposit}
                  totalAmount={walkInTotal}
                />
              </SectionCard>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button
                  onClick={handleCompleteCheckIn}
                  className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md"
                >
                  Complete Check-In Process
                </Button>
              </div>
            </>
          )}
    </div>
  );
}
