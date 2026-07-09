"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Phone,
  Search,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { reservationBookings } from "@/app/data";
import { roomNumbers } from "@/app/data/frontoffice/constants";
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

type Step = "find" | "verify" | "assign" | "done";

const steps: { id: Step; label: string; num: number }[] = [
  { id: "find", label: "Find Booking", num: 1 },
  { id: "verify", label: "Verify Guest", num: 2 },
  { id: "assign", label: "Assign Room", num: 3 },
  { id: "done", label: "Complete", num: 4 },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CheckInForm() {
  const [bookingId, setBookingId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [booking, setBooking] = useState<(typeof reservationBookings)[0] | null>(null);
  const [assignedRoom, setAssignedRoom] = useState("");
  const [keyCard, setKeyCard] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [vehicle, setVehicle] = useState("");
  const [remarks, setRemarks] = useState("");
  const [idFile, setIdFile] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const arrivalsToday = useMemo(
    () =>
      reservationBookings.filter(
        (b) =>
          b.arrivingToday &&
          b.status !== "Checked In" &&
          b.status !== "Cancelled",
      ),
    [],
  );

  const currentStep: Step = completed
    ? "done"
    : !booking
      ? "find"
      : !idFile
        ? "verify"
        : "assign";

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const loadBooking = (found: (typeof reservationBookings)[0]) => {
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
  };

  const handleLookup = () => {
    setLookupError("");
    const found = reservationBookings.find(
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

  const handleComplete = () => {
    if (!booking) return;
    if (!assignedRoom) {
      setLookupError("Please assign a room before completing check-in.");
      return;
    }
    if (!idFile) {
      setLookupError("Please upload guest ID proof before check-in.");
      return;
    }
    setCompleted(true);
    setToast(
      `${booking.guestName} checked in to Room ${assignedRoom}. Key card: ${keyCard || "Pending"}. Deposit: ${formatINR(deposit)}.`,
    );
  };

  const clearSelection = () => {
    setBooking(null);
    setBookingId("");
    setLookupError("");
    setCompleted(false);
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
        description="Verify guest details, assign room, collect deposit, and complete check-in."
        badge={
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5">
            <Users className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Arriving today</p>
              <p className="text-sm font-semibold text-slate-800">
                {arrivalsToday.length} guest{arrivalsToday.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        }
        action={
          booking && !completed ? (
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={handleComplete}
              disabled={!idFile || !assignedRoom}
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
                      isActive && !isDone && "bg-blue-600 text-white ring-4 ring-blue-100",
                      !isActive && !isDone && "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "hidden truncate text-sm font-medium sm:block",
                      isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400",
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column — search & arrivals */}
        <div className="space-y-5 lg:col-span-2">
          {/* Search */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <Button
                onClick={handleLookup}
                className="h-11 w-full gap-2 bg-blue-600 hover:bg-blue-700"
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
                        ? "border-blue-300 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                        : "border-white/80 bg-white hover:border-emerald-300 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                          isSelected
                            ? "bg-blue-600 text-white"
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
                            ? "text-blue-500"
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-md shadow-blue-200/50">
                      {getInitials(booking.guestName)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {booking.guestName}
                      </p>
                      <p className="text-sm text-slate-500">{booking.id}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
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
                      : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30",
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
                className="h-12 w-full gap-2 bg-blue-600 hover:bg-blue-700 lg:hidden"
                onClick={handleComplete}
                disabled={!idFile || !assignedRoom}
              >
                <UserCheck className="h-4 w-4" />
                Complete Check-in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
