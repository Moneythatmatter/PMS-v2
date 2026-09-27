"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
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
import { guestProfileToCheckInDetails, findGuestByEmail, findGuestByIdNumber, findGuestByMobile, guestToFormFields, normalizeIdNumber, normalizeMobile } from "@/components/frontoffice/guestFormUtils";
import { GuestDuplicatePromptModal } from "@/components/frontoffice/GuestDuplicatePromptModal";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import {
  formatRoomGuestName,
  RoomGuestsSection,
  serializeRoomGuests,
  type RoomGuestDraft,
} from "@/components/frontoffice/checkin/RoomGuestsSection";

import { bookingTypeOptions } from "@/app/data/frontoffice/checkin";

import { GuestDetailsSection } from "./GuestDetailsSection";
import type { GuestDetails } from "./GuestDetailsSection";
import { RoomAssignmentSection } from "./RoomAssignmentSection";
import { PaymentBillingSection } from "./PaymentBillingSection";

const inputClass = "rounded-xl";

const emptyGuestDetails = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
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
};

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

type ArrivalListRow =
  | { kind: "solo"; booking: ReservationBooking }
  | {
      kind: "group";
      groupId: string;
      groupName: string;
      groupNo?: string | null;
      children: ReservationBooking[];
    };

/** Collapse group child bookings into one row — same idea as All Bookings. */
function buildArrivalListRows(
  bookings: ReservationBooking[],
): ArrivalListRow[] {
  const groups = new Map<string, ReservationBooking[]>();
  const solos: ReservationBooking[] = [];

  for (const booking of bookings) {
    const groupId = String(booking.groupId ?? "").trim();
    if (!groupId) {
      solos.push(booking);
      continue;
    }
    const list = groups.get(groupId) ?? [];
    list.push(booking);
    groups.set(groupId, list);
  }

  const rows: ArrivalListRow[] = [];
  for (const [groupId, children] of groups) {
    rows.push({
      kind: "group",
      groupId,
      groupName:
        children[0]?.groupName?.trim() ||
        children[0]?.guestName?.trim() ||
        "Group booking",
      groupNo: children[0]?.groupNo,
      children,
    });
  }
  for (const booking of solos) {
    rows.push({ kind: "solo", booking });
  }
  return rows;
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
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
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
  profile?: ReturnType<typeof guestProfileToCheckInDetails> & {
    name?: string;
    mobile?: string;
    email?: string;
  },
) {
  const fromBooking = guestDetailsFromBooking(booking);
  if (!profile) return fromBooking;
  const nameParts = String(profile.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    firstName: nameParts[0] || fromBooking.firstName,
    lastName: nameParts.slice(1).join(" ") || fromBooking.lastName,
    mobile:
      String(profile.mobile || "")
        .replace(/\D/g, "")
        .slice(0, 10) || fromBooking.mobile,
    email: profile.email || fromBooking.email,
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
  _profile: ReturnType<typeof guestProfileToCheckInDetails>,
): Partial<Record<keyof ReturnType<typeof guestProfileToCheckInDetails>, boolean>> {
  return {};
}

function isEligibleForCheckIn(status: string) {
  const s = String(status || "").toLowerCase().trim().replace(/[-_]/g, " ");
  // Block terminal / already-in-house statuses; allow Confirmed, Reserved, and other open states
  return !(
    s === "checked in" ||
    s === "cancelled" ||
    s === "checked out" ||
    s === "in house" ||
    s === "completed" ||
    s === "no show"
  );
}

function findBookingInList(
  bookings: ReservationBooking[],
  key: string,
): ReservationBooking | undefined {
  const trimmed = key.trim();
  if (!trimmed) return undefined;
  const byId = bookings.find((b) => b.id === trimmed);
  if (byId) return byId;
  const record = findBookingByQuery(
    bookings.map(reservationToLookupRecord),
    trimmed,
  );
  if (!record) return undefined;
  return bookings.find((b) => b.id === record.id);
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
  const [deposit, setDeposit] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [idFile, setIdFile] = useState("");
  const [lockedIdentityFields, setLockedIdentityFields] = useState<
    Partial<Record<keyof GuestDetails, boolean>>
  >({});
  const [guestDetails, setGuestDetails] = useState({ ...emptyGuestDetails });
  const [identityErrors, setIdentityErrors] = useState<Record<string, boolean | string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roomGuests, setRoomGuests] = useState<RoomGuestDraft[]>([]);
  const [roomGuestErrors, setRoomGuestErrors] = useState<Record<string, string>>(
    {},
  );
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [completed, setCompleted] = useState(false);
  const [pmsBookings, setPmsBookings] = useState<any[]>([]);
  const [bookingsReady, setBookingsReady] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<
    { id?: string; roomNo: string; roomType: string; status: string; housekeeping: string }[]
  >([]);
  const [roomIdByNo, setRoomIdByNo] = useState<Record<string, string>>({});
  const [roomTypeRates, setRoomTypeRates] = useState<Record<string, number>>({});
  const [arrivalDate, setArrivalDate] = useState(() => todayIso());
  const [expandedArrivalGroups, setExpandedArrivalGroups] = useState<
    Set<string>
  >(() => new Set());
  const [guestProfiles, setGuestProfiles] = useState<GuestProfile[]>([]);
  const [selectedStayingGuestId, setSelectedStayingGuestId] = useState<
    string | null
  >(null);
  const [companionLinkedGuestIds, setCompanionLinkedGuestIds] = useState<
    Record<string, string>
  >({});
  const [ignoredDuplicateKeys, setIgnoredDuplicateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    guest: GuestProfile;
    field: "mobile" | "email" | "idNumber";
    matchValue: string;
    target: "primary" | "walkin" | string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, roomCards, roomTypes, guests] = await Promise.all([
          reservationService.list(),
          roomService.status(),
          roomTypeService.list().catch(() => []),
          guestService.list().catch(() => [] as GuestProfile[]),
        ]);
        if (cancelled) return;
        setPmsBookings(bookings);
        setGuestProfiles(guests);
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
          setGuestProfiles([]);
        }
      } finally {
        if (!cancelled) setBookingsReady(true);
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
          b.status !== "In-House" &&
          b.status !== "No Show",
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

  const arrivalListRows = useMemo(
    () => buildArrivalListRows(arrivalsOnSelectedDate as ReservationBooking[]),
    [arrivalsOnSelectedDate],
  );

  const arrivalsTodayCount = useMemo(
    () => buildArrivalListRows(arrivalsToday as ReservationBooking[]).length,
    [arrivalsToday],
  );

  useEffect(() => {
    const groupId = String(booking?.groupId ?? "").trim();
    if (!groupId) return;
    setExpandedArrivalGroups((prev) => {
      if (prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });
  }, [booking?.groupId, booking?.id]);

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
    if (
      selectedStayingGuestId &&
      ["mobile", "email", "idNumber", "firstName", "lastName"].includes(key)
    ) {
      setSelectedStayingGuestId(null);
    }
    if (value.trim()) {
      setIdentityErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const duplicateKey = (target: string, field: string, value: string) =>
    `${target}:${field}:${value}`;

  const lookupDuplicateGuest = useCallback(
    (
      field: "mobile" | "email" | "idNumber",
      value: string,
      excludeGuestId?: string | null,
    ): GuestProfile | null => {
      if (field === "mobile") {
        return (
          findGuestByMobile(guestProfiles, value, excludeGuestId ?? undefined) ??
          null
        );
      }
      if (field === "email") {
        return (
          findGuestByEmail(guestProfiles, value, excludeGuestId ?? undefined) ??
          null
        );
      }
      return (
        findGuestByIdNumber(guestProfiles, value, excludeGuestId ?? undefined) ??
        null
      );
    },
    [guestProfiles],
  );

  const promptIfDuplicate = useCallback(
    (
      target: "primary" | "walkin" | string,
      field: "mobile" | "email" | "idNumber",
      rawValue: string,
      excludeGuestId?: string | null,
    ) => {
      const value =
        field === "mobile"
          ? normalizeMobile(rawValue)
          : field === "idNumber"
            ? normalizeIdNumber(rawValue)
            : rawValue.trim().toLowerCase();
      if (!value) return false;
      if (field === "mobile" && value.length < 10) return false;
      if (field === "email" && !value.includes("@")) return false;
      if (field === "idNumber" && value.length < 4) return false;

      const key = duplicateKey(target, field, value);
      if (ignoredDuplicateKeys.has(key)) return false;

      const match = lookupDuplicateGuest(field, rawValue, excludeGuestId);
      if (!match) return false;

      setDuplicatePrompt({
        guest: match,
        field,
        matchValue: value,
        target,
      });
      return true;
    },
    [ignoredDuplicateKeys, lookupDuplicateGuest],
  );

  const applyExistingGuestToPrimary = useCallback(
    (guest: GuestProfile, alsoWalkIn: boolean) => {
      const fields = guestToFormFields(guest);
      const profile = guestProfileToCheckInDetails(guest);
      setGuestDetails({
        firstName: fields.firstName,
        lastName: fields.lastName,
        mobile: fields.mobile,
        email: fields.email,
        ...profile,
      });
      setSelectedStayingGuestId(guest.id);
      setLockedIdentityFields(profileLockedFields(profile));
      if (profile.idNumber) setIdFile("On file");
      if (alsoWalkIn) {
        setWalkIn((prev) => ({
          ...prev,
          firstName: fields.firstName,
          lastName: fields.lastName,
          mobile: fields.mobile,
          email: fields.email,
        }));
      }
      setIdentityErrors({});
      setErrors((prev) => {
        const next = { ...prev };
        delete next.mobile;
        delete next.email;
        delete next.firstName;
        delete next.lastName;
        return next;
      });
      setToastVariant("success");
      setToast(`Using existing guest profile: ${guest.name}`);
    },
    [],
  );

  const applyExistingGuestToCompanion = useCallback(
    (draftId: string, guest: GuestProfile) => {
      const fields = guestToFormFields(guest);
      const profile = guestProfileToCheckInDetails(guest);
      setRoomGuests((prev) =>
        prev.map((g) =>
          g.id === draftId
            ? {
                ...g,
                firstName: fields.firstName,
                lastName: fields.lastName,
                mobile: fields.mobile,
                email: fields.email,
                ...profile,
              }
            : g,
        ),
      );
      setCompanionLinkedGuestIds((prev) => ({ ...prev, [draftId]: guest.id }));
      setRoomGuestErrors((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${draftId}.`)) delete next[key];
        }
        return next;
      });
      setToastVariant("success");
      setToast(`Linked companion to existing guest: ${guest.name}`);
    },
    [],
  );

  const handlePrimaryIdentityBlur = (
    field: "mobile" | "email" | "idNumber",
  ) => {
    if (lockedIdentityFields[field]) return;
    const exclude =
      selectedStayingGuestId || booking?.guestId || undefined;
    const value = String(guestDetails[field] ?? "");
    promptIfDuplicate("primary", field, value, exclude);
  };

  const handleWalkInIdentityBlur = (field: "mobile" | "email") => {
    if (selectedStayingGuestId) return;
    const value = field === "mobile" ? walkIn.mobile : walkIn.email;
    promptIfDuplicate("walkin", field, value, selectedStayingGuestId);
  };

  const handleCompanionIdentityBlur = (
    draftId: string,
    field: "mobile" | "email" | "idNumber",
  ) => {
    const companion = roomGuests.find((g) => g.id === draftId);
    if (!companion) return;
    const exclude = companionLinkedGuestIds[draftId];
    promptIfDuplicate(draftId, field, String(companion[field] ?? ""), exclude);
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
    setRoomGuestErrors({});
    setRoomGuests([]);
    setCompanionLinkedGuestIds({});
    setSelectedStayingGuestId(bookingRecord.guestId || null);
    setIgnoredDuplicateKeys(new Set());
    setDuplicatePrompt(null);
    setGuestDetails(guestDetailsFromBooking(bookingRecord));

    if (bookingRecord.guestId) {
      try {
        const guest = await guestService.get(bookingRecord.guestId);
        const profileDetails = guestProfileToCheckInDetails(guest);
        setGuestDetails(
          mergeGuestDetails(bookingRecord, {
            ...profileDetails,
            name: guest.name,
            mobile: guest.mobile,
            email: guest.email,
          }),
        );
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
    if (!prefillBookingKey || !bookingsReady) return;
    if (prefillAttempted.current === prefillBookingKey) return;

    let cancelled = false;

    const run = async () => {
      const fromList = findBookingInList(
        pmsBookings as ReservationBooking[],
        prefillBookingKey,
      );

      let candidate = fromList ?? null;
      if (!candidate) {
        try {
          candidate = await reservationService.get(prefillBookingKey);
        } catch {
          candidate = null;
        }
      }

      if (cancelled) return;

      if (!candidate) {
        prefillAttempted.current = prefillBookingKey;
        setCheckInMode("reserved");
        const msg =
          "Booking was not found for check-in. It may belong to another property or was removed.";
        setLookupError(msg);
        setToastVariant("error");
        setToast(msg);
        return;
      }

      if (!isEligibleForCheckIn(candidate.status)) {
        prefillAttempted.current = prefillBookingKey;
        setCheckInMode("reserved");
        const label = displayBookingNo(candidate);
        const msg = `Booking ${label} is “${candidate.status || "unknown"}” and cannot be checked in.`;
        setLookupError(msg);
        setToastVariant("error");
        setToast(msg);
        return;
      }

      prefillAttempted.current = prefillBookingKey;
      setLookupError("");
      void loadArrival(candidate);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [prefillBookingKey, pmsBookings, bookingsReady, loadArrival]);

  const handleLookupBooking = (idToSearch?: string) => {
    const query = (idToSearch ?? bookingId).trim();
    if (!query) {
      setLookupError("Please enter or select a reservation reference number.");
      return;
    }

    const found =
      findBookingInList(eligibleArrivals as ReservationBooking[], query) ??
      findBookingInList(pmsBookings as ReservationBooking[], query);

    if (found && isEligibleForCheckIn(found.status)) {
      setLookupError("");
      void loadArrival(found);
      return;
    }

    if (found && !isEligibleForCheckIn(found.status)) {
      const msg = `Booking ${displayBookingNo(found)} is “${found.status}” and cannot be checked in.`;
      setLookupError(msg);
      showToast(msg, "error");
      return;
    }

    // Direct fetch for pasted UUID / deep link
    void (async () => {
      try {
        const remote = await reservationService.get(query);
        if (!isEligibleForCheckIn(remote.status)) {
          const msg = `Booking ${displayBookingNo(remote)} is “${remote.status}” and cannot be checked in.`;
          setLookupError(msg);
          showToast(msg, "error");
          return;
        }
        setLookupError("");
        void loadArrival(remote);
      } catch {
        const msg = `No active arrival found matching "${query}". Try booking ID, name, phone, or email — or switch to Walk-in.`;
        setLookupError(msg);
        showToast(msg, "error");
      }
    })();
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const isGroupBooking = Boolean(booking?.groupId);
  const groupOwnerName = isGroupBooking
    ? String(booking?.guestName || "").trim() || "Group owner"
    : "";

  const handleCompleteCheckIn = async () => {
    const stayingGuestName = formatRoomGuestName({
      firstName: guestDetails.firstName,
      lastName: guestDetails.lastName,
    });

    const guestNameForApi =
      checkInMode === "reserved"
        ? isGroupBooking
          ? stayingGuestName || "Guest"
          : (booking?.guestName ?? "Guest")
        : walkInGuestName;
    const roomForApi =
      checkInMode === "reserved"
        ? assignedRoom
        : walkIn.room || assignedRoom;

    const newErrors: Record<string, string> = {};
    const contactErrors: Record<string, string> = {};

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

    if (checkInMode === "reserved" && isGroupBooking && !booking?.guestId) {
      if (!String(guestDetails.firstName ?? "").trim()) {
        contactErrors.firstName = "Required";
      }
      if (!String(guestDetails.lastName ?? "").trim()) {
        contactErrors.lastName = "Required";
      }
      const mob = String(guestDetails.mobile ?? "").replace(/\D/g, "");
      if (!mob) {
        contactErrors.mobile = "Required";
      } else if (mob.length !== 10) {
        contactErrors.mobile = "Must be 10 digits";
      }
      if (!String(guestDetails.email ?? "").trim()) {
        contactErrors.email = "Required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(guestDetails.email).trim())
      ) {
        contactErrors.email = "Invalid email";
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
    if (Object.keys(contactErrors).length) {
      missingLabels.unshift("Guest name / contact");
    }

    const companionFieldErrors: Record<string, string> = {};
    const companionRequired: Array<[keyof GuestDetails, string]> = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["mobile", "Mobile"],
      ["email", "Email"],
      ...identityFields,
    ];
    for (const companion of roomGuests) {
      for (const [key, label] of companionRequired) {
        const raw = String(companion[key] ?? "").trim();
        if (!raw) {
          companionFieldErrors[`${companion.id}.${key}`] = "Required";
          continue;
        }
        if (key === "mobile") {
          const digits = raw.replace(/\D/g, "");
          if (digits.length !== 10) {
            companionFieldErrors[`${companion.id}.mobile`] = "Must be 10 digits";
          }
        }
        if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          companionFieldErrors[`${companion.id}.email`] = "Invalid email";
        }
      }
    }
    if (Object.keys(companionFieldErrors).length) {
      missingLabels.push("Additional guest details");
    }

    setIdentityErrors({
      ...Object.fromEntries(missingIdentity.map(([key]) => [key, true])),
      ...contactErrors,
    });
    setRoomGuestErrors(companionFieldErrors);
    setErrors(newErrors);

    if (
      missingLabels.length > 0 ||
      Object.keys(newErrors).length > 0 ||
      Object.keys(companionFieldErrors).length > 0
    ) {
      showToast(
        missingLabels.length === 1
          ? `${missingLabels[0]} is required.`
          : `Please complete required fields: ${missingLabels.slice(0, 4).join(", ")}${missingLabels.length > 4 ? "…" : ""}.`,
        "error",
      );
      return;
    }
    setErrors({});

    // Block create if an unresolved duplicate exists — ask clerk first
    if (!selectedStayingGuestId) {
      const primaryExclude = booking?.guestId || undefined;
      const contactFields: Array<"mobile" | "email" | "idNumber"> = [
        "mobile",
        "email",
        "idNumber",
      ];
      for (const field of contactFields) {
        const raw =
          checkInMode === "walkin" && (field === "mobile" || field === "email")
            ? field === "mobile"
              ? walkIn.mobile
              : walkIn.email
            : String(guestDetails[field] ?? "");
        const target =
          checkInMode === "walkin" && (field === "mobile" || field === "email")
            ? "walkin"
            : "primary";
        if (promptIfDuplicate(target, field, raw, primaryExclude)) {
          showToast(
            "Matching guest found — choose existing profile or continue as new.",
            "error",
          );
          return;
        }
      }
    }
    for (const companion of roomGuests) {
      if (companionLinkedGuestIds[companion.id]) continue;
      for (const field of ["mobile", "email", "idNumber"] as const) {
        if (
          promptIfDuplicate(
            companion.id,
            field,
            String(companion[field] ?? ""),
            null,
          )
        ) {
          showToast(
            "Matching guest found for an additional guest — choose existing or continue as new.",
            "error",
          );
          return;
        }
      }
    }

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

      const roomGuestNotes = serializeRoomGuests(guestDetails, roomGuests);
      const remarksWithGuests = [remarks.trim(), roomGuestNotes]
        .filter(Boolean)
        .join("\n\n");

      async function createCompanionGuestIds(): Promise<string[]> {
        const ids: string[] = [];
        for (const companion of roomGuests) {
          const linked = companionLinkedGuestIds[companion.id];
          if (linked) {
            ids.push(linked);
            continue;
          }
          const name =
            formatRoomGuestName(companion) ||
            `Companion ${ids.length + 1}`;
          const created = await guestService.create({
            name,
            email: String(companion.email ?? "").trim() || undefined,
            mobile: String(companion.mobile ?? "").replace(/\D/g, ""),
            nationality: companion.nationality || undefined,
            gender: companion.gender || undefined,
            dob: companion.dob || undefined,
            address: companion.address || undefined,
            city: companion.city || undefined,
            state: companion.state || undefined,
            country: companion.country || undefined,
            pincode: companion.pincode || undefined,
            idType: companion.idProofType || undefined,
            idNumber: companion.idNumber || undefined,
          });
          if (created?.id) ids.push(created.id);
        }
        return ids;
      }

      if (checkInMode === "reserved" && booking) {
        const roomRefId =
          (roomForApi && roomIdByNo[roomForApi]) || roomForApi || undefined;

        let guestId =
          booking.guestId || selectedStayingGuestId || undefined;

        if (!guestId && isGroupBooking) {
          const createdGuest = await guestService.create({
            name: guestNameForApi,
            email: String(guestDetails.email ?? "").trim() || undefined,
            mobile: String(guestDetails.mobile ?? "").replace(/\D/g, ""),
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
          guestId = createdGuest.id;
          await reservationService.update(booking.id, {
            guestId,
            specialRequests: remarksWithGuests || undefined,
          } as Partial<ReservationBooking>);
        } else if (
          selectedStayingGuestId &&
          selectedStayingGuestId !== booking.guestId
        ) {
          guestId = selectedStayingGuestId;
          await reservationService.update(booking.id, {
            guestId,
            specialRequests: remarksWithGuests || undefined,
          } as Partial<ReservationBooking>);
        } else if (remarksWithGuests) {
          await reservationService.update(booking.id, {
            specialRequests: remarksWithGuests,
          } as Partial<ReservationBooking>);
        }

        const companionGuestIds = await createCompanionGuestIds();

        await reservationService.checkIn(booking.id, {
          roomRefId,
          guestId,
          companionGuestIds,
          ...guestPayload,
        });
      } else {
        const checkIn = formatStayDate(new Date());
        const checkOutDate = new Date();
        checkOutDate.setDate(checkOutDate.getDate() + walkIn.nights);
        const checkOut = formatStayDate(checkOutDate);

        let walkInGuestId = selectedStayingGuestId || "";
        if (!walkInGuestId) {
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
          walkInGuestId = guest.id;
        }

        const companionGuestIds = await createCompanionGuestIds();

        const walkInRoomRef =
          (roomForApi && roomIdByNo[roomForApi]) || roomForApi || undefined;
        const created = await reservationService.create({
          guestId: walkInGuestId,
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
          specialRequests: remarksWithGuests || undefined,
        } as Partial<ReservationBooking>);
        await reservationService.checkIn(created.id, {
          roomRefId: walkInRoomRef,
          companionGuestIds,
        });
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

  const assignableRooms = useMemo(() => {
    const type = String(walkIn.roomType || booking?.roomType || "").trim();
    const matchingType = type
      ? availableRooms.filter(
        (r) => r.roomType?.toLowerCase() === type.toLowerCase(),
      )
      : [];
    const pool = matchingType.length > 0 ? matchingType : availableRooms;
    const list: { roomNo: string; roomType?: string }[] = pool.map((r) => ({
      roomNo: r.roomNo,
      roomType: r.roomType,
    }));

    const selected = String(assignedRoom || "").trim();
    const isPlaceholder =
      !selected ||
      /^tba$/i.test(selected) ||
      /^n\/?a$/i.test(selected) ||
      /^unassigned$/i.test(selected);
    if (
      !isPlaceholder &&
      !list.some((r) => r.roomNo === selected)
    ) {
      const fromAll = availableRooms.find((r) => r.roomNo === selected);
      list.unshift({
        roomNo: selected,
        roomType: fromAll?.roomType || type || undefined,
      });
    }
    return list;
  }, [availableRooms, walkIn.roomType, booking?.roomType, assignedRoom]);

  const preferredRoomType = String(
    walkIn.roomType || booking?.roomType || "",
  ).trim();

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
                {arrivalsTodayCount} arrival
                {arrivalsTodayCount !== 1 ? "s" : ""}
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
              setGuestDetails({ ...emptyGuestDetails });
              setRoomGuests([]);
              setRoomGuestErrors({});
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
                    setGuestDetails({ ...emptyGuestDetails });
                    setRoomGuests([]);
                    setRoomGuestErrors({});
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
                    {arrivalListRows.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {arrivalListRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-500">
                    {isSelectedArrivalDateToday
                      ? "No expected arrivals for today."
                      : "No expected arrivals on this date."}
                  </p>
                ) : (
                  arrivalListRows.map((row) => {
                    if (row.kind === "group") {
                      const expanded = expandedArrivalGroups.has(row.groupId);
                      const childSelected = row.children.some(
                        (c) => booking?.id === c.id,
                      );
                      const totalAmount = row.children.reduce(
                        (sum, c) => sum + Number(c.totalAmount ?? 0),
                        0,
                      );
                      const checkIn = row.children
                        .map((c) => c.checkIn)
                        .filter(Boolean)
                        .sort()[0];
                      return (
                        <div
                          key={`g-${row.groupId}`}
                          className={cn(
                            "overflow-hidden rounded-xl border transition-all",
                            childSelected
                              ? "border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-100"
                              : "border-white/80 bg-white",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedArrivalGroups((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.groupId)) next.delete(row.groupId);
                                else next.add(row.groupId);
                                return next;
                              });
                            }}
                            className="flex w-full items-start gap-3 p-3.5 text-left hover:bg-indigo-50/50"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 text-sm font-bold text-white">
                              {getInitials(row.groupName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-semibold text-slate-900">
                                  {row.groupName}
                                </p>
                                <ChevronDown
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
                                    expanded && "rotate-180",
                                  )}
                                />
                              </div>
                              <p className="text-xs text-slate-500">
                                {[
                                  row.groupNo,
                                  `${row.children.length} room${row.children.length === 1 ? "" : "s"}`,
                                  checkIn ? `In ${checkIn}` : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  <Users className="h-2.5 w-2.5" />
                                  Group
                                </span>
                                {totalAmount > 0 ? (
                                  <span className="text-xs font-semibold text-emerald-700">
                                    {formatINR(totalAmount)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>

                          {expanded ? (
                            <div className="space-y-1.5 border-t border-indigo-100/80 bg-white/70 px-2.5 py-2">
                              {row.children.map((arr) => {
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
                                      "w-full rounded-lg border px-3 py-2.5 text-left transition-all",
                                      isSelected
                                        ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-100"
                                        : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/40",
                                    )}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div
                                        className={cn(
                                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                                          isSelected
                                            ? "bg-emerald-700 text-white"
                                            : "bg-slate-100 text-slate-600",
                                        )}
                                      >
                                        <BedDouble className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                          {roomLabel}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-500">
                                          {formatBookingGuestLine(arr)}
                                          {arr.guestName
                                            ? ` · ${arr.guestName}`
                                            : ""}
                                        </p>
                                        <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                                          {arr.roomType}
                                          {typeof arr.totalAmount === "number"
                                            ? ` · ${formatINR(arr.totalAmount)}`
                                            : ""}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    const arr = row.booking;
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
                              {(arr as { isVip?: boolean }).isVip && (
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
                        {getInitials(
                          isGroupBooking ? groupOwnerName : booking.guestName,
                        )}
                      </div>
                      <div className="min-w-0">
                        {isGroupBooking ? (
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Group owner
                            {booking.groupName ? ` · ${booking.groupName}` : ""}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <p className="truncate text-lg font-bold text-slate-900">
                            {isGroupBooking
                              ? groupOwnerName
                              : booking.guestName}
                          </p>
                          {(booking as { isVip?: boolean }).isVip && (
                            <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatBookingGuestLine(booking)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBooking(null);
                        setBookingId("");
                        setLookupError("");
                        setLockedIdentityFields({});
                        setRoomGuests([]);
                        setRoomGuestErrors({});
                        setGuestDetails({
                          firstName: "",
                          lastName: "",
                          mobile: "",
                          email: "",
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
                  title={
                    isGroupBooking
                      ? "Guest staying in this room"
                      : "Identity & Registration"
                  }
                  description={
                    isGroupBooking
                      ? "One form for the guest in this room. Add companions below if needed."
                      : hasLockedProfileFields
                        ? "Known guest details are loaded from profile and cannot be changed here."
                        : "Verify guest identification and address credentials."
                  }
                >
                  <GuestDetailsSection
                    guestDetails={guestDetails}
                    includeContact={isGroupBooking}
                    onChange={handleGuestDetailChange}
                    onIdentityBlur={handlePrimaryIdentityBlur}
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
                  <RoomGuestsSection
                    guests={roomGuests}
                    onChange={(next) => {
                      setRoomGuests(next);
                      setRoomGuestErrors({});
                      setCompanionLinkedGuestIds((prev) => {
                        const keep = new Set(next.map((g) => g.id));
                        const updated: Record<string, string> = {};
                        for (const [id, guestId] of Object.entries(prev)) {
                          if (keep.has(id)) updated[id] = guestId;
                        }
                        return updated;
                      });
                    }}
                    errors={roomGuestErrors}
                    onIdentityBlur={handleCompanionIdentityBlur}
                  />
            </SectionCard>

                <SectionCard
                  icon={KeyRound}
                  title="Room Assignment"
                  description="Pick a vacant room and note any special requests."
                >
                  <RoomAssignmentSection
                    assignedRoom={assignedRoom}
                    onAssignedRoomChange={(room) => {
                      setAssignedRoom(room);
                      if (errors.room) {
                        setErrors((p) => ({ ...p, room: "" }));
                      }
                    }}
                    remarks={remarks}
                    onRemarksChange={setRemarks}
                    availableRooms={assignableRooms}
                    preferredRoomType={preferredRoomType}
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
                  setSelectedStayingGuestId(null);
                  if (errors.mobile) {
                    setErrors((p) => ({ ...p, mobile: "" }));
                  }
                }}
                onBlur={() => handleWalkInIdentityBlur("mobile")}
                />
              </FormField>
              <FormField label="Email Address">
                <TextInput
                  type="email"
                  className={inputClass}
                  placeholder="guest@example.com"
                  value={walkIn.email}
                onChange={(e) => {
                  setWalkIn((p) => ({ ...p, email: e.target.value }));
                  setSelectedStayingGuestId(null);
                }}
                onBlur={() => handleWalkInIdentityBlur("email")}
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
              onIdentityBlur={handlePrimaryIdentityBlur}
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
            title="Room Assignment"
            description="Pick a vacant room and note any special requests."
          >
            <RoomAssignmentSection
              assignedRoom={assignedRoom}
              onAssignedRoomChange={setAssignedRoom}
              remarks={remarks}
              onRemarksChange={setRemarks}
              availableRooms={assignableRooms}
              preferredRoomType={preferredRoomType}
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

      <GuestDuplicatePromptModal
        open={Boolean(duplicatePrompt)}
        guest={duplicatePrompt?.guest ?? null}
        field={duplicatePrompt?.field ?? "mobile"}
        onClose={() => setDuplicatePrompt(null)}
        onKeepNew={() => {
          if (!duplicatePrompt) return;
          const key = duplicateKey(
            duplicatePrompt.target,
            duplicatePrompt.field,
            duplicatePrompt.matchValue,
          );
          setIgnoredDuplicateKeys((prev) => new Set(prev).add(key));
          setDuplicatePrompt(null);
          setToastVariant("success");
          setToast("Continuing with new guest details.");
        }}
        onUseExisting={() => {
          if (!duplicatePrompt) return;
          const { guest, target } = duplicatePrompt;
          if (target === "primary") {
            applyExistingGuestToPrimary(guest, false);
          } else if (target === "walkin") {
            applyExistingGuestToPrimary(guest, true);
          } else {
            applyExistingGuestToCompanion(target, guest);
          }
          setDuplicatePrompt(null);
        }}
      />
    </div>
  );
}
