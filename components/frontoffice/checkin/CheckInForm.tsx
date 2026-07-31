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

import {
  baseSteps,
  bookingTypeOptions,
  mockAvailableRooms,
  mockCorporateProfiles,
  mockRatePlans,
  walkInRates,
  type CheckInStep as Step,
} from "@/app/data/frontoffice/checkin";

import { GuestDetailsSection } from "./GuestDetailsSection";
import { RoomAssignmentSection } from "./RoomAssignmentSection";
import { PaymentBillingSection } from "./PaymentBillingSection";

const emptyOption = (label: string) => (
  <option value="" disabled hidden>{label}</option>
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

  const walkInRate = walkInRates[walkIn.roomType] ?? 3500;
  const walkInTotal = walkInRate * walkIn.nights * walkIn.adults;
  const walkInGuestName =
    [walkIn.firstName, walkIn.lastName].filter(Boolean).join(" ") || "Guest";
  const walkInCheckIn = useMemo(() => formatStayDate(new Date()), []);
  const walkInCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (walkIn.nights || 1));
    return formatStayDate(d);
  }, [walkIn.nights]);

  const activeGuestName =
    checkInMode === "reserved"
      ? booking?.guestName ?? "Guest"
      : walkInGuestName;

  const handleGuestDetailChange = (key: string, value: string) => {
    setGuestDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleLookupBooking = (idToSearch?: string) => {
    const query = (idToSearch ?? bookingId).trim();
    if (!query) {
      setLookupError("Please enter or select a reservation reference number.");
      return;
    }

    const found = arrivalsToday.find(
      (b) =>
        b.id.toLowerCase() === query.toLowerCase() ||
        b.guestName.toLowerCase().includes(query.toLowerCase()),
    );

    if (found) {
      setBooking(found);
      setBookingId(found.id);
      setAssignedRoom(found.assignedRoom || (found.roomType === "Suite" ? "301" : "112"));
      setDeposit(found.advancePaid || 0);
      setLookupError("");
      setToast(`Loaded booking reference ${found.id} for ${found.guestName}.`);
    } else {
      setLookupError(`No active arrival found matching "${query}". Try another ID or switch to Walk-in.`);
    }
  };

  const handleCompleteCheckIn = async () => {
    const guestNameForApi = checkInMode === "reserved" ? (booking?.guestName ?? "Guest") : walkInGuestName;
    const roomForApi = checkInMode === "reserved" ? assignedRoom : (walkIn.room || assignedRoom);

    try {
      if (checkInMode === "reserved" && booking) {
        await reservationService.checkIn(booking.id);
      } else {
        await guestService.create({
          name: guestNameForApi,
          email: walkIn.email || undefined,
          mobile: walkIn.mobile || undefined,
        });
      }

      setCompleted(true);
      setToast(`Check-in completed successfully for ${guestNameForApi} in Room ${roomForApi}!`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to complete check-in.");
    }
  };

  const availableRoomNumbers = useMemo(() => {
    if (Array.isArray(mockAvailableRooms)) {
      return mockAvailableRooms.map((r: any) => typeof r === "string" ? r : r.roomNo);
    }
    return [...roomNumbers];
  }, []);

  return (
    <div className="space-y-6 select-none">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      <FOPageHeader
        eyebrow="Front Office"
        title="Guest Check-In Desk"
        description="Process arrivals for reserved bookings or instant walk-in guests."
      />

      {/* Mode Selector */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setCheckInMode("reserved")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            checkInMode === "reserved"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Reserved Arrival Check-In
        </button>
        <button
          type="button"
          onClick={() => setCheckInMode("walkin")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
            checkInMode === "walkin"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Zap className="h-4 w-4 text-amber-500" />
          Instant Walk-In Registration
        </button>
      </div>

      {completed ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
          <h2 className="text-xl font-extrabold text-slate-900">Check-In Completed!</h2>
          <p className="text-sm text-slate-600">
            {activeGuestName} has been assigned to <strong>Room {checkInMode === "reserved" ? assignedRoom : walkIn.room}</strong>.
          </p>
          <Button
            onClick={() => {
              setCompleted(false);
              setBooking(null);
              setBookingId("");
              setWalkIn({ ...defaultWalkIn });
              setWalkInRef(generateWalkInRef());
            }}
            className="!bg-[#0F8A5F] text-white font-bold rounded-xl"
          >
            Process Next Arrival
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Find Reservation or Walk-In Info */}
          {checkInMode === "reserved" ? (
            <SectionCard icon={Search} title="Find Reserved Booking" description="Search by reservation ID or guest name.">
              <div className="sm:col-span-2 lg:col-span-3 space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput
                      className="pl-9 rounded-xl"
                      placeholder="Enter Booking ID (e.g. BK-1002) or guest name…"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleLookupBooking()}
                    className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl px-5"
                  >
                    Lookup
                  </Button>
                </div>

                {lookupError && (
                  <p className="text-xs font-semibold text-rose-600">{lookupError}</p>
                )}

                {arrivalsToday.length > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Today&apos;s Expected Arrivals:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {arrivalsToday.map((arr) => (
                        <button
                          key={arr.id}
                          type="button"
                          onClick={() => handleLookupBooking(arr.id)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                          {arr.guestName} ({arr.id})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          ) : (
            <SectionCard icon={User} title="Walk-In Guest Details" description="Log instant walk-in guest information.">
              <FormField label="First Name" required>
                <TextInput
                  className={inputClass}
                  placeholder="e.g. Rajesh"
                  value={walkIn.firstName}
                  onChange={(e) => setWalkIn((p) => ({ ...p, firstName: e.target.value }))}
                />
              </FormField>
              <FormField label="Last Name" required>
                <TextInput
                  className={inputClass}
                  placeholder="e.g. Kumar"
                  value={walkIn.lastName}
                  onChange={(e) => setWalkIn((p) => ({ ...p, lastName: e.target.value }))}
                />
              </FormField>
              <FormField label="Mobile Phone" required>
                <TextInput
                  className={inputClass}
                  placeholder="+91 98765 43210"
                  value={walkIn.mobile}
                  onChange={(e) => setWalkIn((p) => ({ ...p, mobile: e.target.value }))}
                />
              </FormField>
              <FormField label="Email Address">
                <TextInput
                  type="email"
                  className={inputClass}
                  placeholder="guest@example.com"
                  value={walkIn.email}
                  onChange={(e) => setWalkIn((p) => ({ ...p, email: e.target.value }))}
                />
              </FormField>
              <FormField label="Booking Category" required>
                <SelectInput
                  className={inputClass}
                  value={walkIn.bookingType}
                  onChange={(e) => setWalkIn((p) => ({ ...p, bookingType: e.target.value as any }))}
                >
                  {emptyOption("Select type")}
                  {bookingTypeOptions.map((t) => {
                    const idVal = typeof t === "string" ? t : (t as any).id;
                    const labelVal = typeof t === "string" ? t : (t as any).label;
                    return (
                      <option key={idVal} value={idVal}>{labelVal}</option>
                    );
                  })}
                </SelectInput>
              </FormField>
              {walkIn.bookingType === "Company" && (
                <FormField label="Company Name">
                  <CompanySearchSelect
                    value={walkIn.companyName}
                    onChange={(val) => setWalkIn((p) => ({ ...p, companyName: val }))}
                    onSelect={(c) => setWalkIn((p) => ({ ...p, companyName: c.name, companyId: c.id }))}
                  />
                </FormField>
              )}
            </SectionCard>
          )}

          {/* Section 2: Identity & Registration */}
          <SectionCard icon={UserCheck} title="Identity & Registration" description="Verify guest identification and address credentials.">
            <GuestDetailsSection
              guestDetails={guestDetails}
              onChange={handleGuestDetailChange}
              onFileUpload={setIdFile}
              idFile={idFile}
            />
          </SectionCard>

          {/* Section 3: Room Assignment & Keycard */}
          <SectionCard icon={KeyRound} title="Room Assignment & Keycard" description="Assign clean ready room and encode keycard RFID.">
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

          {/* Section 4: Billing & Deposit */}
          <SectionCard icon={CreditCard} title="Billing & Deposit Collection" description="Collect advance deposit and confirm payment mode.">
            <PaymentBillingSection
              paymentMode={checkInMode === "reserved" ? "Cash" : walkIn.paymentMode}
              onPaymentModeChange={(val) => setWalkIn((p) => ({ ...p, paymentMode: val }))}
              deposit={deposit}
              onDepositChange={setDeposit}
              totalAmount={checkInMode === "reserved" ? (booking?.totalAmount ?? 4500) : walkInTotal}
            />
          </SectionCard>

          {/* Submit Action */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button
              onClick={handleCompleteCheckIn}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold px-8 py-3 rounded-xl shadow-md text-sm"
            >
              Complete Check-In Process
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
