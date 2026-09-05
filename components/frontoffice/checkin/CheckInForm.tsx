"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
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
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { displayBookingNo } from "@/lib/booking-display";
import { formatBookingGuestLine } from "@/lib/reservation-display";
import { isArrivingOnDate, isArrivingToday, todayIso } from "@/lib/reservation-dates";
import { BookingLookupSearch } from "@/components/frontoffice/BookingLookupSearch";
import {
  findBookingByQuery,
  reservationToLookupRecord,
} from "@/lib/booking-lookup";
import { guestProfileToCheckInDetails } from "@/components/frontoffice/guestFormUtils";

import { bookingTypeOptions } from "@/app/data/frontoffice/checkin";

import { GuestDetailsSection } from "./GuestDetailsSection";
import type { GuestDetails } from "./GuestDetailsSection";
import { RoomAssignmentSection } from "./RoomAssignmentSection";
import { PaymentBillingSection } from "./PaymentBillingSection";

const inputClass = "rounded-xl";

type CheckInMode = "reserved" | "walkin";

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

function getInitials(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
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

function guestDetailsFromBooking(found: ReservationBooking) {
  return {
    gender: found.gender || "",
    dob: found.dob || "",
    nationality: found.nationality || "",
    address: found.address || "",
    city: found.city || "",
    state: found.state || "",
    country: found.country || "",
    pincode: found.pincode || "",
    idProofType: found.idProofType || "",
    idNumber: found.idNumber || "",
  };
}

function mergeGuestDetails(
  booking: ReservationBooking,
  profile?: ReturnType<typeof guestProfileToCheckInDetails>,
) {
  const fromBooking = guestDetailsFromBooking(booking);
  if (!profile) return fromBooking;
  return {
    gender: profile.gender || fromBooking.gender,
    dob: profile.dob || fromBooking.dob,
    nationality: profile.nationality || fromBooking.nationality,
    address: profile.address || fromBooking.address,
    city: profile.city || fromBooking.city,
    state: profile.state || fromBooking.state,
    country: profile.country || fromBooking.country,
    pincode: profile.pincode || fromBooking.pincode,
    idProofType: profile.idProofType || fromBooking.idProofType,
    idNumber: profile.idNumber || fromBooking.idNumber,
  };
}

function profileLockedFields(
  profile: ReturnType<typeof guestProfileToCheckInDetails>,
): Partial<Record<keyof ReturnType<typeof guestProfileToCheckInDetails>, boolean>> {
  const locked: Partial<
    Record<keyof ReturnType<typeof guestProfileToCheckInDetails>, boolean>
  > = {};
  (Object.keys(profile) as (keyof typeof profile)[]).forEach((key) => {
    if (String(profile[key] || "").trim()) locked[key] = true;
  });
  return locked;
}

function isEligibleForCheckIn(status: string) {
  return (
    status !== "Checked In" &&
    status !== "Cancelled" &&
    status !== "Checked Out" &&
    status !== "In-House"
  );
}

export function CheckInForm() {
  const searchParams = useSearchParams();
  const prefillBookingKey =
    searchParams.get("bookingId") ?? searchParams.get("booking") ?? "";
  const prefillAttempted = useRef<string | null>(null);
  const arrivalDateInputRef = useRef<HTMLInputElement>(null);
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
  const [lockedIdentityFields, setLockedIdentityFields] = useState<
    Partial<Record<keyof GuestDetails, boolean>>
  >({});
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
  const [identityErrors, setIdentityErrors] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [completed, setCompleted] = useState(false);
  const [pmsBookings, setPmsBookings] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<
    { id?: string; roomNo: string; roomType: string; status: string; housekeeping: string }[]
  >([]);
  const [roomIdByNo, setRoomIdByNo] = useState<Record<string, string>>({});
  const [roomTypeRates, setRoomTypeRates] = useState<Record<string, number>>({});
  const [arrivalDate, setArrivalDate] = useState(() => todayIso());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, roomCards, roomTypes] = await Promise.all([
          reservationService.list(),
          roomService.status(),
          roomTypeService.list().catch(() => []),
        ]);
        if (cancelled) return;
        setPmsBookings(bookings);

        // Assignable rooms: not blocked/maintenance; operational status comes from hk_rooms.
        const assignable = roomCards
          .filter((r) => {
            const status = String(r.status || "").trim().toLowerCase();
            return (
              status !== "blocked" &&
              status !== "maintenance" &&
              status !== "occupied"
            );
          })
          .map((r) => ({
            id: r.id,
            roomNo: r.roomNo,
            roomType: r.type,
            status: r.status,
            housekeeping: r.housekeeping,
          }));
        setAvailableRooms(assignable);
        const idByNo: Record<string, string> = {};
        for (const r of assignable) {
          if (r.id) idByNo[r.roomNo] = r.id;
        }
        setRoomIdByNo(idByNo);

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

  const eligibleArrivals = useMemo(
    () =>
      pmsBookings.filter(
        (b) =>
          b.status !== "Checked In" &&
          b.status !== "Cancelled" &&
          b.status !== "Checked Out" &&
          b.status !== "In-House",
      ),
    [pmsBookings],
  );

  const lookupPool = useMemo(
    () => eligibleArrivals.map(reservationToLookupRecord),
    [eligibleArrivals],
  );

  const arrivalsToday = useMemo(
    () => eligibleArrivals.filter((b) => isArrivingToday(b)),
    [eligibleArrivals],
  );

  const arrivalsOnSelectedDate = useMemo(
    () => eligibleArrivals.filter((b) => isArrivingOnDate(b, arrivalDate)),
    [eligibleArrivals, arrivalDate],
  );

  const isSelectedArrivalDateToday = arrivalDate === todayIso();

  const arrivalSectionTitle = useMemo(() => {
    if (isSelectedArrivalDateToday) return "Arriving Today";
    const d = new Date(`${arrivalDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "Arrivals";
    return `Arriving ${d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }, [arrivalDate, isSelectedArrivalDateToday]);

  const hasLockedProfileFields = useMemo(
    () => Object.values(lockedIdentityFields).some(Boolean),
    [lockedIdentityFields],
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
    if (lockedIdentityFields[key as keyof GuestDetails]) return;
    setGuestDetails((prev) => ({ ...prev, [key]: value }));
    if (value.trim()) {
      setIdentityErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const loadArrival = useCallback(async (found: ReservationBooking) => {
    let bookingRecord = found;
    try {
      const full = await reservationService.get(found.id);
      bookingRecord = full;
    } catch {
      // use list row if detail fetch fails
    }

    setCheckInMode("reserved");
    setBooking(bookingRecord);
    setBookingId(displayBookingNo(bookingRecord));
    setLockedIdentityFields({});
    setIdFile("");
    const preassigned = String(bookingRecord.roomNo || "").trim();
    const isRealRoom =
      preassigned &&
      !/^tba$/i.test(preassigned) &&
      !/^n\/?a$/i.test(preassigned) &&
      !/^unassigned$/i.test(preassigned);
    setAssignedRoom(isRealRoom ? preassigned : "");
    setDeposit(bookingRecord.advancePaid || 0);
    setLookupError("");
    setErrors({});
    setIdentityErrors({});
    setGuestDetails(guestDetailsFromBooking(bookingRecord));

    if (bookingRecord.guestId) {
      try {
        const guest = await guestService.get(bookingRecord.guestId);
        const profileDetails = guestProfileToCheckInDetails(guest);
        setGuestDetails(mergeGuestDetails(bookingRecord, profileDetails));
        setLockedIdentityFields(profileLockedFields(profileDetails));
        if (profileDetails.idNumber) {
          setIdFile("On file");
        }
      } catch {
        setGuestDetails(guestDetailsFromBooking(bookingRecord));
        setLockedIdentityFields({});
      }
    } else {
      setLockedIdentityFields({});
    }

    setToastVariant("success");
    setToast(
      `Loaded booking ${displayBookingNo(bookingRecord)} for ${bookingRecord.guestName}.`,
    );
  }, []);

  useEffect(() => {
    if (!prefillBookingKey || pmsBookings.length === 0) return;
    if (prefillAttempted.current === prefillBookingKey) return;

    const eligible = pmsBookings.filter((b) => isEligibleForCheckIn(b.status));
    const foundRecord = findBookingByQuery(
      eligible.map(reservationToLookupRecord),
      prefillBookingKey,
    );
    const found = foundRecord
      ? eligible.find((b) => b.id === foundRecord.id)
      : undefined;

    if (found) {
      prefillAttempted.current = prefillBookingKey;
      void loadArrival(found);
      return;
    }

    prefillAttempted.current = prefillBookingKey;
    setCheckInMode("reserved");
    setLookupError(
      `Booking "${prefillBookingKey}" was not found or is not eligible for check-in.`,
    );
  }, [prefillBookingKey, pmsBookings, loadArrival]);

  const handleLookupBooking = (idToSearch?: string) => {
    const query = (idToSearch ?? bookingId).trim();
    if (!query) {
      setLookupError("Please enter or select a reservation reference number.");
      return;
    }

    const foundRecord = findBookingByQuery(lookupPool, query);
    const found = foundRecord
      ? eligibleArrivals.find((b) => b.id === foundRecord.id)
      : undefined;

    if (found) {
      void loadArrival(found);
    } else {
      setLookupError(
        `No active arrival found matching "${query}". Try booking ID, name, phone, or email — or switch to Walk-in.`,
      );
    }
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
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

    const newErrors: Record<string, string> = {};
    const todayStr = todayIso();

    if (checkInMode === "walkin") {
      if (!walkIn.firstName.trim()) {
        newErrors.firstName = "First name is required.";
      }
      if (!walkIn.lastName.trim()) {
        newErrors.lastName = "Last name is required.";
      }

      const cleanMobile = walkIn.mobile.trim().replace(/\D/g, "");
      if (!cleanMobile) {
        newErrors.mobile = "Mobile phone is required.";
      } else if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
        newErrors.mobile = "Mobile number must be a valid 10-digit number.";
      }

      if (!walkIn.bookingType) {
        newErrors.bookingType = "Booking type is required.";
      }
      if (walkIn.bookingType === "Company" && !walkIn.companyId) {
        newErrors.companyName = "Please select a company.";
      }
    }

    const identityFields: [keyof typeof guestDetails, string][] = [
      ["gender", "Gender"],
      ["dob", "Date of Birth"],
      ["nationality", "Nationality"],
      ["address", "Address"],
      ["city", "City"],
      ["state", "State / Province"],
      ["country", "Country"],
      ["pincode", "Pincode / Zip"],
      ["idProofType", "ID Proof Type"],
      ["idNumber", "ID Document Number"],
    ];

    const missingIdentity = identityFields.filter(
      ([key]) => !String(guestDetails[key] || "").trim(),
    );
    const missingLabels = missingIdentity.map(([, label]) => label);

    if (!idFile && !lockedIdentityFields.idNumber) {
      missingLabels.push("Upload ID Document");
    }
    if (!String(roomForApi || "").trim()) missingLabels.push("Assigned Room Number");
    if (checkInMode === "walkin" && !walkIn.paymentMode) {
      missingLabels.push("Payment Mode");
    }

    setIdentityErrors(Object.fromEntries(missingIdentity.map(([key]) => [key, true])));

    if (missingLabels.length > 0) {
      showToast(
        missingLabels.length === 1
          ? `${missingLabels[0]} is required.`
          : `Please complete ${missingLabels.length} required fields: ${missingLabels.join(", ")}.`,
        "error",
      );
      return;
    }
    setErrors({});

    try {
      const guestPayload = {
        gender: guestDetails.gender,
        dob: guestDetails.dob,
        nationality: guestDetails.nationality,
        address: guestDetails.address,
        city: guestDetails.city,
        state: guestDetails.state,
        country: guestDetails.country,
        pincode: guestDetails.pincode,
        idProofType: guestDetails.idProofType,
        idNumber: guestDetails.idNumber,
      };

      if (checkInMode === "reserved" && booking) {
        const roomRefId =
          (roomForApi && roomIdByNo[roomForApi]) || roomForApi || undefined;
        await reservationService.checkIn(booking.id, {
          roomRefId,
          ...guestPayload,
        } as Partial<ReservationBooking>);
      } else {
        const checkIn = formatStayDate(new Date());
        const checkOutDate = new Date();
        checkOutDate.setDate(checkOutDate.getDate() + walkIn.nights);
        const checkOut = formatStayDate(checkOutDate);

        const guest = await guestService.create({
          name: guestNameForApi,
          email: walkIn.email || undefined,
          mobile: walkIn.mobile,
          nationality: guestDetails.nationality || undefined,
          gender: guestDetails.gender || undefined,
          dob: guestDetails.dob || undefined,
          address: guestDetails.address || undefined,
          city: guestDetails.city || undefined,
          state: guestDetails.state || undefined,
          country: guestDetails.country || undefined,
          pincode: guestDetails.pincode || undefined,
          idType: guestDetails.idProofType || undefined,
          idNumber: guestDetails.idNumber || undefined,
        });

        const walkInRoomRef =
          (roomForApi && roomIdByNo[roomForApi]) || roomForApi || undefined;
        const created = await reservationService.create({
          guestId: guest.id,
          roomRefId: walkInRoomRef,
          checkIn,
          checkOut,
          nights: walkIn.nights,
          adults: walkIn.adults,
          totalAmount: walkInTotal,
          advancePaid: deposit,
          paymentMode: walkIn.paymentMode,
          status: "Confirmed",
          source: "Walk-in",
          bookingType: walkIn.bookingType || "Individual",
          companyName: walkIn.companyName || undefined,
        } as Partial<ReservationBooking>);
        await reservationService.checkIn(created.id, {
          roomRefId: walkInRoomRef,
        } as Partial<ReservationBooking>);
      }

      setCompleted(true);
      showToast(
        `Check-in completed successfully for ${guestNameForApi} in Room ${roomForApi}!`,
      );
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to complete check-in.",
        "error",
      );
    }
  };

  const availableRoomNumbers = useMemo(() => {
    const type = String(walkIn.roomType || booking?.roomType || "").trim();
    const matchingType = type
      ? availableRooms.filter(
        (r) => r.roomType?.toLowerCase() === type.toLowerCase(),
      )
      : [];
    // Prefer same room type; if none vacant, show all vacant rooms
    const pool = matchingType.length > 0 ? matchingType : availableRooms;
    const list = pool.map((r) => r.roomNo);

    // Keep a already-selected real vacant room visible if status just changed
    const selected = String(assignedRoom || "").trim();
    const isPlaceholder =
      !selected ||
      /^tba$/i.test(selected) ||
      /^n\/?a$/i.test(selected) ||
      /^unassigned$/i.test(selected);
    if (!isPlaceholder && !list.includes(selected)) {
      list.unshift(selected);
    }
    return list;
  }, [availableRooms, walkIn.roomType, booking?.roomType, assignedRoom]);

  const reservedRoomDisplay = useMemo(() => {
    const roomKey = String(assignedRoom || booking?.roomNo || "").trim();
    const roomLabel = roomKey || "TBA";
    const fromPool = availableRooms.find(
      (r) => r.roomNo === roomKey || r.roomNo.toLowerCase() === roomKey.toLowerCase(),
    );
    const typeLabel =
      String(booking?.roomType || fromPool?.roomType || "").trim() || "—";
    return `${roomLabel} · ${typeLabel}`;
  }, [assignedRoom, booking?.roomNo, booking?.roomType, availableRooms]);

  return (
    <div className="space-y-6 select-none">
      {toast && (
        <AlertBanner
          variant={toastVariant}
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
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer",
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
            setLockedIdentityFields({});
            setIdFile("");
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer",
            checkInMode === "walkin"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          <Zap className="h-4 w-4 " />
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
              setLockedIdentityFields({});
              setIdFile("");
              setGuestDetails({
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
                    Booking ID, name, phone, or email
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <BookingLookupSearch
                  items={lookupPool}
                  query={bookingId}
                  onQueryChange={(value) => {
                    setBookingId(value);
                    setLookupError("");
                  }}
                  selectedId={booking?.id}
                  onSelectItem={(item) => {
                    const record = eligibleArrivals.find((b) => b.id === item.id);
                    if (record) void loadArrival(record);
                  }}
                  onClear={() => {
                    setBookingId("");
                    setBooking(null);
                    setLookupError("");
                    setLockedIdentityFields({});
                    setGuestDetails({
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
                    setIdFile("");
                  }}
                  onEnter={() => handleLookupBooking()}
                  placeholder="e.g. BK-38, Atul, or 98765…"
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
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-900">
                    {arrivalSectionTitle}
                  </p>
                  {!isSelectedArrivalDateToday && (
                    <button
                      type="button"
                      onClick={() => setArrivalDate(todayIso())}
                      className="mt-0.5 text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      Back to today
                    </button>
                  )}
                </div>
                <div className="relative flex shrink-0 items-center gap-2">
                  <input
                    ref={arrivalDateInputRef}
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value || todayIso())}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = arrivalDateInputRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === "function") input.showPicker();
                      else input.click();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                    title="Pick arrival date"
                    aria-label="Pick arrival date"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    {arrivalsOnSelectedDate.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {arrivalsOnSelectedDate.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-500">
                    {isSelectedArrivalDateToday
                      ? "No expected arrivals for today."
                      : "No expected arrivals on this date."}
                  </p>
                ) : (
                  arrivalsOnSelectedDate.map((arr) => {
                    const isSelected = booking?.id === arr.id;
                    const roomLabel =
                      arr.roomNo && arr.roomNo !== "TBA"
                        ? `Room ${arr.roomNo}`
                        : arr.roomType || "Room TBA";
                    return (
                        <button
                          key={arr.id}
                          type="button"
                        onClick={() => void loadArrival(arr)}
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
                              {formatBookingGuestLine(arr)} · {roomLabel}
                              {arr.checkIn ? ` · In ${arr.checkIn}` : ""}
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
          <div className="min-w-0 space-y-5 lg:col-span-3">
            {!booking ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <UserCheck className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-700">
                  No guest selected
                </p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Look up a booking or pick an arrival date to continue check-in.
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
                        <p className="text-sm text-slate-500">{formatBookingGuestLine(booking)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBooking(null);
                        setBookingId("");
                        setLookupError("");
                        setLockedIdentityFields({});
                        setGuestDetails({
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
                        setIdFile("");
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
                        value: reservedRoomDisplay,
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
                  description={
                    hasLockedProfileFields
                      ? "Known guest details are loaded from profile and cannot be changed here."
                      : "Verify guest identification and address credentials."
                  }
                >
                  <GuestDetailsSection
                    guestDetails={guestDetails}
                    onChange={handleGuestDetailChange}
                    onFileUpload={(fn) => {
                      setIdFile(fn);
                      if (errors.idFile) {
                        setErrors((p) => ({ ...p, idFile: "" }));
                      }
                    }}
                    idFile={idFile}
                    errors={identityErrors}
                    readOnlyFields={lockedIdentityFields}
                  />
                </SectionCard>

                <SectionCard
                  icon={KeyRound}
                  title="Room Assignment & Keycard"
                  description="Assign clean ready room and encode keycard RFID."
                >
                  <RoomAssignmentSection
                    assignedRoom={assignedRoom}
                    onAssignedRoomChange={(room) => {
                      setAssignedRoom(room);
                      if (errors.room) {
                        setErrors((p) => ({ ...p, room: "" }));
                      }
                    }}
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
                    onPaymentModeChange={() => { }}
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
            <FormField label="First Name" required error={errors.firstName}>
                <TextInput
                  className={inputClass}
                  placeholder="e.g. Rajesh"
                  value={walkIn.firstName}
                onChange={(e) => {
                  setWalkIn((p) => ({ ...p, firstName: e.target.value }));
                  if (errors.firstName) {
                    setErrors((p) => ({ ...p, firstName: "" }));
                  }
                }}
                />
              </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
                <TextInput
                  className={inputClass}
                  placeholder="e.g. Kumar"
                  value={walkIn.lastName}
                onChange={(e) => {
                  setWalkIn((p) => ({ ...p, lastName: e.target.value }));
                  if (errors.lastName) {
                    setErrors((p) => ({ ...p, lastName: "" }));
                  }
                }}
                />
              </FormField>
            <FormField label="Mobile Phone" required error={errors.mobile}>
                <TextInput
                  className={inputClass}
                placeholder="10-digit mobile number"
                maxLength={10}
                  value={walkIn.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setWalkIn((p) => ({ ...p, mobile: val }));
                  if (errors.mobile) {
                    setErrors((p) => ({ ...p, mobile: "" }));
                  }
                }}
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
            <FormField label="Booking Type" required error={errors.bookingType}>
              <SearchSelect
                options={[...bookingTypeOptions]}
                selectedId={walkIn.bookingType || null}
                placeholder="Search booking type…"
                inputClassName={inputClass}
                onSelect={(option) => {
                  setWalkIn((p) => ({
                    ...p,
                    bookingType: option.id as "Individual" | "Company",
                    ...(option.id === "Individual"
                      ? { companyName: "", companyId: "" }
                      : {}),
                  }));
                  if (errors.bookingType) {
                    setErrors((p) => ({ ...p, bookingType: "" }));
                  }
                }}
                onClear={() =>
                  setWalkIn((p) => ({
                    ...p,
                    bookingType: "",
                    companyName: "",
                    companyId: "",
                  }))
                }
              />
              </FormField>
              {walkIn.bookingType === "Company" && (
              <FormField label="Company Name" error={errors.companyName}>
                  <CompanySearchSelect
                    value={walkIn.companyName}
                  selectedCompanyId={walkIn.companyId || null}
                  onChange={(val) =>
                    setWalkIn((p) => ({
                      ...p,
                      companyName: val,
                      companyId: "",
                    }))
                  }
                  onSelect={(c) => {
                    setWalkIn((p) => ({
                      ...p,
                      companyName: c.name,
                      companyId: c.id,
                    }));
                    if (errors.companyName) {
                      setErrors((p) => ({ ...p, companyName: "" }));
                    }
                  }}
                  onClear={() =>
                    setWalkIn((p) => ({
                      ...p,
                      companyName: "",
                      companyId: "",
                    }))
                  }
                  placeholder="Search company name or code…"
                  inputClassName={inputClass}
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
              onFileUpload={(fn) => {
                setIdFile(fn);
                if (errors.idFile) {
                  setErrors((p) => ({ ...p, idFile: "" }));
                }
              }}
              idFile={idFile}
              errors={identityErrors}
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
