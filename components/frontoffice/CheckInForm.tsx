"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  BedDouble,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  KeyRound,
  MapPin,
  Phone,
  Search,
  Upload,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { CompanySearchSelect } from "@/components/frontoffice/CompanySearchSelect";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import type { ReservationBooking } from "@/app/data/types/frontoffice";
import { guestService, reservationService } from "@/services/front-office";
import {
  countries,
  genders,
  idProofTypes,
  nationalities,
  paymentModes,
  roomNumbers,
  roomTypes,
  states,
} from "@/app/data/frontoffice/constants";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SelectInput,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const emptyOption = (label: string) => (
  <option value="" disabled hidden>{label}</option>
);

type Step = "find" | "verify" | "assign" | "done";
type CheckInMode = "reserved" | "walkin";

const walkInRates: Record<string, number> = {
  Standard: 3500,
  Deluxe: 5200,
  Suite: 8500,
  Premium: 6200,
};

const baseSteps: { id: Step; label: string; num: number }[] = [
  { id: "find", label: "Find Booking", num: 1 },
  { id: "verify", label: "Verify Guest", num: 2 },
  { id: "assign", label: "Assign Room", num: 3 },
  { id: "done", label: "Complete", num: 4 },
];

const inputClass = "rounded-xl";

const bookingTypeOptions = [
  { id: "Individual", label: "Individual", hint: "Personal" },
  { id: "Company", label: "Company", hint: "Corporate" },
] as const;

const defaultWalkIn = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  bookingType: "" as "" | "Individual" | "Company",
  companyName: "",
  companyId: "",
  roomType: "Standard",
  room: "112",
  adults: 1,
  nights: 1,
  paymentMode: "Cash",
};

function generateWalkInRef() {
  return `WI-${String(Date.now()).slice(-6)}`;
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
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CheckInForm() {
  const [checkInMode, setCheckInMode] = useState<CheckInMode>("reserved");
  const [bookingId, setBookingId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [booking, setBooking] = useState<ReservationBooking | null>(null);
  const [walkInRef, setWalkInRef] = useState(generateWalkInRef);
  const [walkIn, setWalkIn] = useState({ ...defaultWalkIn });
  const [assignedRoom, setAssignedRoom] = useState("112");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reservationService.list();
        if (!cancelled) setPmsBookings(data);
      } catch {
        if (!cancelled) setPmsBookings([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const arrivalsToday = useMemo(
    () =>
      pmsBookings.filter(
        (b) =>
          b.status !== "Checked In" &&
          b.status !== "Cancelled" &&
          b.status !== "Checked Out",
      ),
    [pmsBookings],
  );

  const steps = useMemo(
    () =>
      baseSteps.map((step) =>
        step.id === "find" && checkInMode === "walkin"
          ? { ...step, label: "Guest & Stay" }
          : step,
      ),
    [checkInMode],
  );

  const walkInRate = walkInRates[walkIn.roomType] ?? 3500;
  const walkInTotal = walkInRate * walkIn.nights * walkIn.adults;
  const walkInGuestName =
    [walkIn.firstName, walkIn.lastName].filter(Boolean).join(" ") || "Guest";
  const walkInCheckIn = useMemo(() => formatStayDate(new Date()), []);
  const walkInCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + walkIn.nights);
    return formatStayDate(d);
  }, [walkIn.nights]);

  const availableWalkInRooms = useMemo(
    () =>
      roomNumbers.filter((r) => {
        const prefix =
          walkIn.roomType === "Standard"
            ? "1"
            : walkIn.roomType === "Deluxe"
              ? "2"
              : walkIn.roomType === "Suite"
                ? "5"
                : "";
        return prefix ? r.startsWith(prefix) : true;
      }),
    [walkIn.roomType],
  );

  function isGuestProfileComplete(details: typeof guestDetails) {
    return (
      details.gender &&
      details.dob &&
      details.nationality &&
      details.address.trim() &&
      details.city.trim() &&
      details.state &&
      details.country &&
      details.pincode.trim() &&
      details.idProofType &&
      details.idNumber.trim()
    );
  }

  const currentStep: Step = completed
    ? "done"
    : checkInMode === "walkin"
      ? !walkIn.firstName.trim() || !walkIn.lastName.trim() || !walkIn.mobile.trim()
        ? "find"
        : !isGuestProfileComplete(guestDetails) || !idFile
          ? "verify"
          : "assign"
      : !booking
        ? "find"
        : !isGuestProfileComplete(guestDetails) || !idFile
          ? "verify"
          : "assign";

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const loadBooking = (found: ReservationBooking) => {
    setBooking(found);
    setBookingId(found.id);
    setAssignedRoom(found.roomNo);
    setDeposit(Math.min(found.balance, 2000));
    setLookupError("");
    setCompleted(false);
    setIdFile("");
    setKeyCard("");
    setVehicle("");
    setRemarks("");
    setGuestDetails({
      gender: found.gender ?? "",
      dob: found.dob ?? "",
      nationality: found.nationality ?? "",
      address: found.address ?? "",
      city: found.city ?? "",
      state: found.state ?? "",
      country: found.country ?? "",
      pincode: found.pincode ?? "",
      idProofType: found.idProofType ?? "",
      idNumber: found.idNumber ?? "",
    });
  };

  const handleLookup = () => {
    setLookupError("");
    const found = pmsBookings.find(
      (b) => b.id.toLowerCase() === bookingId.trim().toLowerCase(),
    );
    if (!found) {
      setLookupError("No booking found. Try BK-1042, BK-1039, or BK-1038.");
      setBooking(null);
      return;
    }
    if (found.status === "Checked In") {
      setLookupError("This guest is already checked in.");
      setBooking(null);
      return;
    }
    if (found.status === "Cancelled") {
      setLookupError("This booking has been cancelled.");
      setBooking(null);
      return;
    }
    loadBooking(found);
  };

  const handleWalkInComplete = () => {
    setLookupError("");
    if (!walkIn.firstName.trim() || !walkIn.lastName.trim()) {
      setLookupError("First name and last name are required.");
      return;
    }
    if (!walkIn.mobile.trim()) {
      setLookupError("Mobile number is required.");
      return;
    }
    if (!isGuestProfileComplete(guestDetails)) {
      setLookupError("Please complete all guest profile fields before check-in.");
      return;
    }
    if (!idFile) {
      setLookupError("Please upload guest ID proof before check-in.");
      return;
    }
    const room = assignedRoom || walkIn.room;
    if (!room) {
      setLookupError("Please assign a room before completing check-in.");
      return;
    }

    void (async () => {
      try {
        const profilesList = await guestService.list();
        const searchMobile = walkIn.mobile.trim().replace(/[\s\-\+]/g, "");
        const searchEmail = walkIn.email.trim().toLowerCase();
        const searchId = guestDetails.idNumber.trim().toLowerCase();
        const searchName = walkInGuestName.toLowerCase();

        let matchedGuest: GuestProfile | undefined;
        if (searchMobile.length >= 10) {
          matchedGuest = profilesList.find((g) => {
            const gm = (g.mobile || "").replace(/[\s\-\+]/g, "");
            return gm.endsWith(searchMobile) || searchMobile.endsWith(gm);
          });
        }
        if (!matchedGuest && searchEmail) {
          matchedGuest = profilesList.find((g) => (g.email || "").trim().toLowerCase() === searchEmail);
        }
        if (!matchedGuest && searchId) {
          matchedGuest = profilesList.find((g) => (g.idNumber || "").trim().toLowerCase() === searchId);
        }
        if (!matchedGuest) {
          matchedGuest = profilesList.find((g) => (g.name || "").trim().toLowerCase() === searchName);
        }

        let finalGuestId = matchedGuest?.id ?? "";
        if (matchedGuest) {
          await guestService.update(matchedGuest.id, {
            name: walkInGuestName,
            mobile: walkIn.mobile.trim(),
            email: walkIn.email.trim() || matchedGuest.email,
            nationality: guestDetails.nationality || matchedGuest.nationality || "Indian",
            address: guestDetails.address || matchedGuest.address || "",
            idType: guestDetails.idProofType || matchedGuest.idType || "Aadhaar",
            idNumber: guestDetails.idNumber || matchedGuest.idNumber || "",
          });
        } else {
          const created = await guestService.create({
            name: walkInGuestName,
            mobile: walkIn.mobile.trim(),
            email: walkIn.email.trim(),
            nationality: guestDetails.nationality || "Indian",
            totalStays: 1,
            loyaltyPoints: 100,
            idType: guestDetails.idProofType || "Aadhaar",
            idNumber: guestDetails.idNumber,
            address: guestDetails.address,
            memberSince: new Date().toLocaleString("en-IN", { month: "short", year: "numeric" }),
            preferences: [],
          });
          finalGuestId = created.id;
        }

        const record = await reservationService.create({
          guestId: finalGuestId,
          guestName: walkInGuestName,
          phone: walkIn.mobile.trim(),
          email: walkIn.email.trim() || undefined,
          source: "Walk-in",
          roomNo: room,
          roomType: walkIn.roomType,
          checkIn: walkInCheckIn,
          checkOut: walkInCheckOut,
          balance: walkInTotal,
          status: "Checked In",
          adults: walkIn.adults,
          nights: walkIn.nights,
          roomRate: walkInRate,
          totalAmount: walkInTotal,
          paymentMode: walkIn.paymentMode,
          bookingType: walkIn.bookingType || undefined,
          companyName: walkIn.companyName || undefined,
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
        });

        setPmsBookings((prev) => [record, ...prev]);
        setBooking(record);
        setAssignedRoom(room);
        setCompleted(true);
        setToast(
          `Walk-in guest ${record.guestName} checked in to Room ${room}. ${formatINR(walkInTotal)} collected via ${walkIn.paymentMode}.`,
        );
      } catch (e) {
        setLookupError(e instanceof Error ? e.message : "Walk-in check-in failed");
      }
    })();
  };

  const handleComplete = () => {
    if (!booking) return;
    if (!assignedRoom) {
      setLookupError("Please assign a room before completing check-in.");
      return;
    }
    if (!isGuestProfileComplete(guestDetails)) {
      setLookupError("Please complete all guest profile fields before check-in.");
      return;
    }
    if (!idFile) {
      setLookupError("Please upload guest ID proof before check-in.");
      return;
    }

    void (async () => {
      try {
        const updated = await reservationService.checkIn(booking.id, {
          roomNo: assignedRoom,
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
        });
        setPmsBookings((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b)),
        );
        setBooking(updated);
        setCompleted(true);
        setToast(
          `${updated.guestName} checked in to Room ${assignedRoom}.`,
        );
      } catch (e) {
        setLookupError(e instanceof Error ? e.message : "Check-in failed");
      }
    })();
  };

  const updateGuestDetail = (field: keyof typeof guestDetails, value: string) => {
    setGuestDetails((prev) => ({ ...prev, [field]: value }));
    setLookupError("");
  };

  const clearSelection = () => {
    setBooking(null);
    setBookingId("");
    setLookupError("");
    setCompleted(false);
    setIdFile("");
    setKeyCard("");
    setVehicle("");
    setRemarks("");
    setWalkIn({ ...defaultWalkIn });
    setWalkInRef(generateWalkInRef());
    setAssignedRoom(defaultWalkIn.room);
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
  };

  const switchMode = (mode: CheckInMode) => {
    setCheckInMode(mode);
    clearSelection();
  };

  const updateWalkIn = (field: keyof typeof walkIn, value: string | number) => {
    setWalkIn((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "roomType") {
        const prefix =
          value === "Standard" ? "1" : value === "Deluxe" ? "2" : value === "Suite" ? "5" : "";
        const rooms = prefix ? roomNumbers.filter((r) => r.startsWith(prefix)) : roomNumbers;
        next.room = rooms[0] ?? prev.room;
        setAssignedRoom(next.room);
      }
      if (field === "room") {
        setAssignedRoom(String(value));
      }
      return next;
    });
    setLookupError("");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Header */}
      <FOPageHeader
        eyebrow="Front Office"
        title="Check-In"
        description="Complete guest profile, verify ID, assign room, and check in."
        badge={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-emerald-700/80">Arriving today</p>
                <p className="text-sm font-bold text-slate-800">
                  {arrivalsToday.length} guest{arrivalsToday.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div
              role="group"
              aria-label="Check-in type"
              className="inline-flex rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-1 shadow-sm"
            >
              {([
                {
                  id: "reserved" as const,
                  label: "Reserved",
                  icon: CalendarCheck,
                  active: "bg-white text-emerald-700 shadow-md shadow-emerald-100/60 ring-1 ring-emerald-100",
                },
                {
                  id: "walkin" as const,
                  label: "Walk-in",
                  icon: Zap,
                  active: "bg-white text-amber-600 shadow-md shadow-amber-100/60 ring-1 ring-amber-100",
                },
              ]).map(({ id, label, icon: Icon, active }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 sm:px-4",
                    checkInMode === id ? active : "text-slate-500 hover:bg-white/60 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
        action={
          checkInMode === "walkin" && !completed ? (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
              onClick={handleWalkInComplete}
              disabled={currentStep !== "assign" || !assignedRoom}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Complete Check-in
            </Button>
          ) : checkInMode === "reserved" && booking && !completed ? (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
              onClick={handleComplete}
              disabled={!idFile || !assignedRoom || !isGuestProfileComplete(guestDetails)}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Complete Check-in
            </Button>
          ) : completed ? (
            <Button size="sm" disabled className="gap-1.5 bg-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Checked In
            </Button>
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
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isDone && "bg-emerald-500 text-white",
                      isActive && !isDone && "bg-emerald-700 text-white ring-4 ring-emerald-100",
                      !isActive && !isDone && "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "hidden truncate text-sm font-medium sm:block",
                      isActive ? "text-emerald-700" : isDone ? "text-emerald-600" : "text-slate-400",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 min-w-[16px] flex-1 rounded-full",
                      i < stepIndex ? "bg-emerald-300" : "bg-slate-200",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {checkInMode === "walkin" ? (
        completed ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">Check-in Complete</p>
            <p className="mt-1 text-sm text-slate-600">
              {booking?.guestName ?? walkInGuestName} is now in Room {assignedRoom}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={clearSelection}>Check In Another Guest</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {lookupError && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {lookupError}
                </p>
              )}

              <SectionCard icon={User} title="Guest Details" description="Contact information and booking type">
                <FormField label="First Name" required>
                  <TextInput className={inputClass} placeholder="Enter first name" value={walkIn.firstName} onChange={(e) => updateWalkIn("firstName", e.target.value)} />
                </FormField>
                <FormField label="Last Name" required>
                  <TextInput className={inputClass} placeholder="Enter last name" value={walkIn.lastName} onChange={(e) => updateWalkIn("lastName", e.target.value)} />
                </FormField>
                <FormField label="Mobile" required>
                  <TextInput className={inputClass} placeholder="Enter mobile number" value={walkIn.mobile} onChange={(e) => updateWalkIn("mobile", e.target.value)} />
                </FormField>
                <FormField label="Email">
                  <TextInput className={inputClass} type="email" placeholder="Enter email (optional)" value={walkIn.email} onChange={(e) => updateWalkIn("email", e.target.value)} />
                </FormField>
                <FormField label="Booking Type">
                  <SearchSelect
                    options={[...bookingTypeOptions]}
                    selectedId={walkIn.bookingType || null}
                    placeholder="Search booking type…"
                    inputClassName={inputClass}
                    onSelect={(option) => {
                      updateWalkIn("bookingType", option.id);
                      if (option.id === "Individual") {
                        updateWalkIn("companyName", "");
                        updateWalkIn("companyId", "");
                      }
                    }}
                    onClear={() => {
                      updateWalkIn("bookingType", "");
                      updateWalkIn("companyName", "");
                      updateWalkIn("companyId", "");
                    }}
                  />
                </FormField>
                {walkIn.bookingType === "Company" && (
                  <FormField label="Company" className="sm:col-span-2">
                    <CompanySearchSelect
                      value={walkIn.companyName}
                      selectedCompanyId={walkIn.companyId || null}
                      onChange={(v) => {
                        updateWalkIn("companyName", v);
                        updateWalkIn("companyId", "");
                      }}
                      onSelect={(c) => {
                        updateWalkIn("companyName", c.name);
                        updateWalkIn("companyId", c.id);
                      }}
                      onClear={() => {
                        updateWalkIn("companyName", "");
                        updateWalkIn("companyId", "");
                      }}
                      placeholder="Search company name or code…"
                      inputClassName={inputClass}
                    />
                  </FormField>
                )}
              </SectionCard>

              <SectionCard icon={UserCheck} title="Guest Profile" description="ID, address, and verification details collected at check-in">
                <FormField label="Gender" required>
                  <SelectInput className={inputClass} value={guestDetails.gender} onChange={(e) => updateGuestDetail("gender", e.target.value)}>
                    {emptyOption("Select gender")}
                    {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Date of Birth" required>
                  <TextInput className={inputClass} type="date" value={guestDetails.dob} onChange={(e) => updateGuestDetail("dob", e.target.value)} />
                </FormField>
                <FormField label="Nationality" required>
                  <SelectInput className={inputClass} value={guestDetails.nationality} onChange={(e) => updateGuestDetail("nationality", e.target.value)}>
                    {emptyOption("Select nationality")}
                    {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="ID Proof Type" required>
                  <SelectInput className={inputClass} value={guestDetails.idProofType} onChange={(e) => updateGuestDetail("idProofType", e.target.value)}>
                    {emptyOption("Select ID proof")}
                    {idProofTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="ID Number" required className="sm:col-span-2">
                  <TextInput className={inputClass} placeholder="Enter ID / passport / Aadhaar number" value={guestDetails.idNumber} onChange={(e) => updateGuestDetail("idNumber", e.target.value)} />
                </FormField>
                <FormField label="Address" required className="sm:col-span-2 lg:col-span-3">
                  <TextInput className={inputClass} placeholder="Street address" value={guestDetails.address} onChange={(e) => updateGuestDetail("address", e.target.value)} />
                </FormField>
                <FormField label="City" required>
                  <TextInput className={inputClass} placeholder="City" value={guestDetails.city} onChange={(e) => updateGuestDetail("city", e.target.value)} />
                </FormField>
                <FormField label="State" required>
                  <SelectInput className={inputClass} value={guestDetails.state} onChange={(e) => updateGuestDetail("state", e.target.value)}>
                    {emptyOption("Select state")}
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Country" required>
                  <SelectInput className={inputClass} value={guestDetails.country} onChange={(e) => updateGuestDetail("country", e.target.value)}>
                    {emptyOption("Select country")}
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Pincode" required>
                  <TextInput className={inputClass} placeholder="Pincode" value={guestDetails.pincode} onChange={(e) => updateGuestDetail("pincode", e.target.value)} />
                </FormField>
              </SectionCard>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">ID Verification</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Upload passport, Aadhaar, or driving licence</p>
                  </div>
                </div>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                    idFile ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30",
                  )}
                >
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0]?.name ?? "")} />
                  {idFile ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="mt-2 text-sm font-medium text-emerald-700">{idFile}</p>
                      <p className="mt-0.5 text-xs text-emerald-600">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm font-medium text-slate-600">Drop file or click to upload</p>
                      <p className="mt-0.5 text-xs text-slate-400">PNG, JPG or PDF up to 5MB</p>
                    </>
                  )}
                </label>
              </section>

              <SectionCard icon={BedDouble} title="Stay & Room" description="Room allocation and stay duration">
                <FormField label="Room Type">
                  <SelectInput className={inputClass} value={walkIn.roomType} onChange={(e) => updateWalkIn("roomType", e.target.value)}>
                    {roomTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Room Number">
                  <SelectInput className={inputClass} value={walkIn.room} onChange={(e) => updateWalkIn("room", e.target.value)}>
                    {(availableWalkInRooms.length > 0 ? availableWalkInRooms : roomNumbers).map((r) => (
                      <option key={r} value={r}>{r} — {walkIn.roomType}</option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Adults">
                  <TextInput className={inputClass} type="number" min={1} value={walkIn.adults} onChange={(e) => updateWalkIn("adults", Number(e.target.value))} />
                </FormField>
                <FormField label="Nights">
                  <TextInput className={inputClass} type="number" min={1} value={walkIn.nights} onChange={(e) => updateWalkIn("nights", Number(e.target.value))} />
                </FormField>
                <FormField label="Rate / Night">
                  <TextInput className={cn(inputClass, "bg-slate-50")} value={formatINR(walkInRate)} readOnly />
                </FormField>
                <FormField label="Payment Mode">
                  <SelectInput className={inputClass} value={walkIn.paymentMode} onChange={(e) => updateWalkIn("paymentMode", e.target.value)}>
                    {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </SelectInput>
                </FormField>
              </SectionCard>

              <SectionCard icon={KeyRound} title="Check-in Details" description="Key card, deposit, and optional notes">
                <FormField label="Assigned Room">
                  <SelectInput className={inputClass} value={assignedRoom} onChange={(e) => setAssignedRoom(e.target.value)}>
                    {roomNumbers.map((r) => <option key={r} value={r}>{r}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Key Card Number">
                  <TextInput className={inputClass} placeholder="Key card #" value={keyCard} onChange={(e) => setKeyCard(e.target.value)} />
                </FormField>
                <FormField label="Security Deposit">
                  <TextInput className={inputClass} type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
                </FormField>
                <FormField label="Vehicle Number">
                  <TextInput className={inputClass} placeholder="Optional" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
                </FormField>
                <FormField label="Remarks" className="sm:col-span-2 lg:col-span-3">
                  <TextAreaInput className={inputClass} placeholder="Special requests or notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </FormField>
              </SectionCard>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Walk-in Preview</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{walkInGuestName}</p>
                  <p className="text-xs text-slate-500">{walkInRef}</p>

                  <div className="mt-4 space-y-2.5 text-sm">
                    {[
                      { icon: CalendarDays, label: "Check-in", value: walkInCheckIn },
                      { icon: CalendarDays, label: "Check-out", value: walkInCheckOut },
                      { icon: BedDouble, label: "Room", value: walkIn.roomType ? `${walkIn.room || assignedRoom} · ${walkIn.roomType}` : "—" },
                      { icon: Users, label: "Guests", value: walkIn.adults ? `${walkIn.adults} Adult${walkIn.adults !== 1 ? "s" : ""}` : "—" },
                      { icon: walkIn.bookingType === "Company" ? Building2 : User, label: "Booking Type", value: walkIn.bookingType === "Company" ? walkIn.companyName || "Company" : walkIn.bookingType || "Walk-in" },
                      { icon: MapPin, label: "Source", value: "Walk-in" },
                      { icon: CreditCard, label: "Payment", value: walkIn.paymentMode },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase text-slate-400">{label}</p>
                          <p className="truncate font-medium text-slate-800">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {walkIn.nights > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>{formatINR(walkInRate)} × {walkIn.nights} night{walkIn.nights !== 1 ? "s" : ""}</span>
                        <span>{formatINR(walkInTotal)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                    <p className="text-xs font-medium text-amber-100">Total to Collect</p>
                    <p className="text-2xl font-bold">{formatINR(walkInTotal)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <Button
                    onClick={handleWalkInComplete}
                    className="h-11 w-full gap-2 bg-emerald-700 hover:bg-emerald-800"
                    disabled={currentStep !== "assign" || !assignedRoom}
                  >
                    <UserCheck className="h-4 w-4" />
                    Complete Check-in
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column — search & arrivals */}
        <div className="space-y-5 lg:col-span-2">
          {/* Search */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Find Booking</p>
                <p className="text-xs text-slate-500">Search by booking ID or guest name</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter booking ID (e.g. BK-1042)"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <Button
                onClick={handleLookup}
                className="h-11 w-full gap-2 bg-emerald-700 hover:bg-emerald-800"
              >
                Lookup Booking
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {lookupError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {lookupError}
              </p>
            )}
          </div>

          {/* Arriving today */}
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
              {arrivalsToday.map((b) => {
                const isSelected = booking?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => loadBooking(b)}
                    className={cn(
                      "group w-full rounded-xl border p-3.5 text-left transition-all duration-200",
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 shadow-sm ring-2 ring-emerald-100"
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
                        {getInitials(b.guestName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {b.guestName}
                        </p>
                        <p className="text-xs text-slate-500">{b.id}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            <BedDouble className="h-3 w-3" />
                            {b.roomNo} · {b.roomType}
                          </span>
                          <span className="text-slate-400">{b.source}</span>
                        </div>
                      </div>
                      <ArrowRight
                        className={cn(
                          "mt-2 h-4 w-4 shrink-0 transition-transform",
                          isSelected
                            ? "text-emerald-600"
                            : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-emerald-500",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — guest details & room allocation */}
        <div className="lg:col-span-3">
          {!booking ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <UserCheck className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-700">
                No guest selected
              </p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Look up a booking ID or select an arriving guest from the list to begin check-in.
              </p>
            </div>
          ) : completed ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="mt-4 text-xl font-bold text-slate-900">
                Check-in Complete
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {booking.guestName} is now in Room {assignedRoom}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={clearSelection}>
                  Check In Another Guest
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Guest card header */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white shadow-md shadow-emerald-200/50">
                      {getInitials(booking.guestName)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {booking.guestName}
                      </p>
                      <p className="text-sm text-slate-500">{booking.id}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          {booking.status}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {booking.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600"
                  >
                    Change guest
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: Phone, label: "Mobile", value: booking.phone },
                    { icon: Calendar, label: "Stay", value: `${booking.checkIn} – ${booking.checkOut}` },
                    { icon: BedDouble, label: "Room Type", value: booking.roomType },
                    { icon: CreditCard, label: "Balance", value: formatINR(booking.balance) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <Icon className="h-3 w-3" />
                        {label}
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guest profile — collected at check-in */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Guest Profile</p>
                    <p className="text-xs text-slate-500">
                      Complete guest details not captured during reservation
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Gender" required>
                    <SelectInput
                      className="rounded-xl"
                      value={guestDetails.gender}
                      onChange={(e) => updateGuestDetail("gender", e.target.value)}
                    >
                      {emptyOption("Select gender")}
                      {genders.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Date of Birth" required>
                    <TextInput
                      className="rounded-xl"
                      type="date"
                      value={guestDetails.dob}
                      onChange={(e) => updateGuestDetail("dob", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Nationality" required>
                    <SelectInput
                      className="rounded-xl"
                      value={guestDetails.nationality}
                      onChange={(e) => updateGuestDetail("nationality", e.target.value)}
                    >
                      {emptyOption("Select nationality")}
                      {nationalities.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="ID Proof Type" required>
                    <SelectInput
                      className="rounded-xl"
                      value={guestDetails.idProofType}
                      onChange={(e) => updateGuestDetail("idProofType", e.target.value)}
                    >
                      {emptyOption("Select ID proof")}
                      {idProofTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="ID Number" required className="sm:col-span-2">
                    <TextInput
                      className="rounded-xl"
                      placeholder="Enter ID / passport / Aadhaar number"
                      value={guestDetails.idNumber}
                      onChange={(e) => updateGuestDetail("idNumber", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Address" required className="sm:col-span-2">
                    <TextInput
                      className="rounded-xl"
                      placeholder="Street address"
                      value={guestDetails.address}
                      onChange={(e) => updateGuestDetail("address", e.target.value)}
                    />
                  </FormField>
                  <FormField label="City" required>
                    <TextInput
                      className="rounded-xl"
                      placeholder="City"
                      value={guestDetails.city}
                      onChange={(e) => updateGuestDetail("city", e.target.value)}
                    />
                  </FormField>
                  <FormField label="State" required>
                    <SelectInput
                      className="rounded-xl"
                      value={guestDetails.state}
                      onChange={(e) => updateGuestDetail("state", e.target.value)}
                    >
                      {emptyOption("Select state")}
                      {states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Country" required>
                    <SelectInput
                      className="rounded-xl"
                      value={guestDetails.country}
                      onChange={(e) => updateGuestDetail("country", e.target.value)}
                    >
                      {emptyOption("Select country")}
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Pincode" required>
                    <TextInput
                      className="rounded-xl"
                      placeholder="Pincode"
                      value={guestDetails.pincode}
                      onChange={(e) => updateGuestDetail("pincode", e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              {/* ID upload */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">ID Verification</p>
                    <p className="text-xs text-slate-500">Upload passport, Aadhaar, or driving licence</p>
                  </div>
                </div>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                    idFile
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setIdFile(e.target.files?.[0]?.name ?? "")}
                  />
                  {idFile ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="mt-2 text-sm font-medium text-emerald-700">{idFile}</p>
                      <p className="mt-0.5 text-xs text-emerald-600">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Drop file or click to upload
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">PNG, JPG or PDF up to 5MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Room allocation */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Room Allocation</p>
                    <p className="text-xs text-slate-500">Assign room, key card, and collect deposit</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Assigned Room">
                    <SelectInput
                      value={assignedRoom}
                      onChange={(e) => setAssignedRoom(e.target.value)}
                      className="rounded-xl"
                    >
                      {roomNumbers.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Key Card Number">
                    <TextInput
                      placeholder="Key card #"
                      value={keyCard}
                      onChange={(e) => setKeyCard(e.target.value)}
                      className="rounded-xl"
                    />
                  </FormField>
                  <FormField label="Security Deposit">
                    <TextInput
                      type="number"
                      min={0}
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="rounded-xl"
                    />
                  </FormField>
                  <FormField label="Vehicle Number">
                    <TextInput
                      placeholder="Optional"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="rounded-xl"
                    />
                  </FormField>
                  <FormField label="Remarks" className="sm:col-span-2">
                    <TextAreaInput
                      placeholder="Special requests or notes"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="rounded-xl"
                    />
                  </FormField>
                </div>
              </div>

              {/* Mobile complete button */}
              <Button
                className="h-12 w-full gap-2 bg-emerald-700 hover:bg-emerald-800 lg:hidden"
                onClick={handleComplete}
                disabled={!idFile || !assignedRoom || !isGuestProfileComplete(guestDetails)}
              >
                <UserCheck className="h-4 w-4" />
                Complete Check-in
              </Button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
