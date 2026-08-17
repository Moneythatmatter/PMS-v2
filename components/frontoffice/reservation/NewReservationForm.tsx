"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  User,
  Users,
} from "lucide-react";
import {
  bookingSources as fallbackBookingSources,
  mealPlans,
  paymentModes,
  tariffPlans,
  roomTypes,
} from "@/app/data/frontoffice/constants";
import { currentUser } from "@/app/data";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import {
  bookingSourceService,
  guestService,
  tariffPlanService,
  reservationService,
  roomService,
  roomTypeService,
} from "@/services/front-office";
import { CompanySearchSelect } from "@/components/frontoffice/CompanySearchSelect";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
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

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : 0;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDayString(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Step = "guest" | "booking" | "payment" | "done";

const steps: { id: Step; label: string; num: number }[] = [
  { id: "guest", label: "Guest Details", num: 1 },
  { id: "booking", label: "Booking", num: 2 },
  { id: "payment", label: "Payment", num: 3 },
  { id: "done", label: "Confirm", num: 4 },
];

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

const inputClass = "rounded-xl";

const bookingTypeOptions = [
  { id: "Individual", label: "Individual", hint: "Personal" },
  { id: "Company", label: "Company", hint: "Corporate" },
] as const;

export function NewReservationForm() {
  const searchParams = useSearchParams();
  const todayStr = useMemo(() => getTodayString(), []);

  const searchParamCheckIn = searchParams.get("checkIn");
  const searchParamCheckOut = searchParams.get("checkOut");

  const initialCheckIn = searchParamCheckIn
    ? searchParamCheckIn < todayStr
      ? todayStr
      : searchParamCheckIn
    : "";

  const initialCheckOut = searchParamCheckOut
    ? searchParamCheckOut < todayStr
      ? initialCheckIn
        ? getNextDayString(initialCheckIn)
        : getNextDayString(todayStr)
      : initialCheckIn && searchParamCheckOut <= initialCheckIn
        ? getNextDayString(initialCheckIn)
        : searchParamCheckOut
    : "";

  const [savedBookingNo, setSavedBookingNo] = useState<string | null>(null);
  const [availableRoomNos, setAvailableRoomNos] = useState<string[]>([]);
  const [tariffByPlanMap, setTariffByPlanMap] = useState<Record<string, number>>({});
  const [baseRateByRoomMap, setBaseRateByRoomMap] = useState<Record<string, number>>({});
  const [roomsByType, setRoomsByType] = useState<Record<string, string[]>>({});
  const [roomTypeOptions, setRoomTypeOptions] = useState<string[]>(() => [
    ...roomTypes,
  ]);
  const [tariffPlanOptions, setTariffPlanOptions] = useState<
    { id: string; label: string; hint?: string; mealPlan?: string }[]
  >(() =>
    tariffPlans.map((p) => ({
      id: p,
      label: p,
      hint: "₹0.00/night",
    })),
  );
  const [sourceOptions, setSourceOptions] = useState<
    { id: string; label: string; hint?: string }[]
  >(() =>
    fallbackBookingSources.map((s) => ({ id: s, label: s })),
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    bookingType: "" as "" | "Individual" | "Company",
    companyName: "",
    companyId: "",
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    adults: 1,
    children: 0,
    roomType: searchParams.get("roomType") ?? "",
    roomNumber: searchParams.get("room") ?? "",
    tariffPlan: "",
    mealPlan: "",
    source: "",
    advancePaid: 0,
    paymentMode: "",
    // Linked guest fields
    guestId: "",
    nationality: "",
    idProofType: "",
    idNumber: "",
    address: "",
    gender: "",
    dob: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    preferences: [] as string[],
    notes: "",
    loyaltyPoints: 0,
    totalStays: 0,
  });

  // Prefill from Room Availability (or deep links) when query params change
  useEffect(() => {
    const room = searchParams.get("room");
    const roomType = searchParams.get("roomType");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (!room && !roomType && !checkIn && !checkOut) return;

    const today = getTodayString();
    let validCheckIn = checkIn ?? undefined;
    if (validCheckIn && validCheckIn < today) {
      validCheckIn = today;
    }

    let validCheckOut = checkOut ?? undefined;
    if (validCheckOut && validCheckOut < today) {
      validCheckOut = validCheckIn ? getNextDayString(validCheckIn) : getNextDayString(today);
    } else if (validCheckIn && validCheckOut && validCheckOut <= validCheckIn) {
      validCheckOut = getNextDayString(validCheckIn);
    }

    setForm((prev) => ({
      ...prev,
      ...(room ? { roomNumber: room } : {}),
      ...(roomType ? { roomType } : {}),
      ...(validCheckIn ? { checkIn: validCheckIn } : {}),
      ...(validCheckOut ? { checkOut: validCheckOut } : {}),
    }));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roomCards, roomTypesData, tariffPlansData, sourcesData] =
          await Promise.all([
            roomService.status(),
            roomTypeService.list().catch(() => []),
            tariffPlanService.list().catch(() => []),
            bookingSourceService.list().catch(() => []),
          ]);
        if (cancelled) return;

        // Same source/rules as Room Status: only Vacant rooms are assignable
        const byType: Record<string, string[]> = {};
        const nos: string[] = [];
        for (const r of roomCards) {
          if (String(r.status || "").trim().toLowerCase() !== "vacant") continue;
          nos.push(r.roomNo);
          const key = r.type || "Other";
          if (!byType[key]) byType[key] = [];
          byType[key].push(r.roomNo);
        }
        setAvailableRoomNos(nos);
        setRoomsByType(byType);

        const roomRates: Record<string, number> = {};
        const typeNames: string[] = [];
        for (const rt of roomTypesData) {
          if (!rt.name) continue;
          roomRates[rt.name] = rt.baseRate || 0;
          if (rt.status !== "Inactive") typeNames.push(rt.name);
        }
        setBaseRateByRoomMap(roomRates);
        if (typeNames.length > 0) setRoomTypeOptions(typeNames);

        const planRates: Record<string, number> = {};
        if (tariffPlansData && tariffPlansData.length > 0) {
          const activePlans = tariffPlansData.filter((rp) => rp.status !== "Inactive");
          const planOptions = activePlans.map((rp) => {
            const planKey = rp.name || rp.code;
            const displayLabel =
              rp.name && rp.code && rp.name !== rp.code
                ? `${rp.name} (${rp.code})`
                : rp.name || rp.code;
            return {
              id: planKey,
              label: displayLabel,
              hint: `${formatINR(rp.baseRate || 0)}/night`,
              mealPlan: rp.mealPlan,
            };
          });
          setTariffPlanOptions(planOptions);

          for (const rp of tariffPlansData) {
            if (rp.code) planRates[rp.code] = rp.baseRate || 0;
            if (rp.name) planRates[rp.name] = rp.baseRate || 0;
            if (rp.code && rp.name) {
              planRates[`${rp.name} (${rp.code})`] = rp.baseRate || 0;
            }
            if (rp.name?.toLowerCase().includes("corporate")) planRates["Corporate"] = rp.baseRate || 0;
            if (rp.name?.toLowerCase().includes("weekend")) planRates["Weekend"] = rp.baseRate || 0;
            if (rp.name?.toLowerCase().includes("long")) planRates["Long Stay"] = rp.baseRate || 0;
          }
        } else {
          planRates["BAR"] = 3500;
          planRates["Corporate"] = 3200;
          planRates["Weekend"] = 4800;
          planRates["Long Stay"] = 3000;
        }
        setTariffByPlanMap(planRates);

        const activeSources = sourcesData.filter((s) => s.status === "Active");
        if (activeSources.length > 0) {
          setSourceOptions(
            activeSources.map((s) => ({
              id: s.id,
              label: s.name,
              hint: s.code,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setAvailableRoomNos([]);
          setRoomsByType({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Automated Existing Guest Detection and Auto-Fill
  useEffect(() => {
    if (!form.mobile && !form.email && (!form.firstName || !form.lastName)) {
      return;
    }

    let cancelled = false;
    (async () => {
      let profilesList: GuestProfile[] = [];
      try {
        profilesList = await guestService.list();
      } catch {
        return;
      }
      if (cancelled) return;

      const searchMobile = form.mobile.trim().replace(/[\s\-\+]/g, "");
      const searchEmail = form.email.trim().toLowerCase();
      const searchName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim().toLowerCase();

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

      if (!matchedGuest && form.idNumber) {
        const searchId = form.idNumber.trim().toLowerCase();
        matchedGuest = profilesList.find((g) => (g.idNumber || "").trim().toLowerCase() === searchId);
      }

      if (!matchedGuest && form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2) {
        matchedGuest = profilesList.find((g) => (g.name || "").trim().toLowerCase() === searchName);
      }

      if (matchedGuest) {
        const nameParts = (matchedGuest.name || "").split(" ");
        const matchFirstName = nameParts[0] || "";
        const matchLastName = nameParts.slice(1).join(" ") || "";

        setForm((prev) => {
          const cleanMatchedMobile = (matchedGuest!.mobile || "").replace(/\D/g, "");
          if (
            prev.guestId === matchedGuest!.id &&
            prev.firstName === matchFirstName &&
            prev.lastName === matchLastName &&
            prev.mobile === cleanMatchedMobile &&
            prev.email === matchedGuest!.email
          ) {
            return prev;
          }

          return {
            ...prev,
            guestId: matchedGuest!.id,
            firstName: matchFirstName,
            lastName: matchLastName,
            mobile: cleanMatchedMobile,
            email: matchedGuest!.email,
            nationality: matchedGuest!.nationality || prev.nationality || "",
            idProofType: matchedGuest!.idType || prev.idProofType || "",
            idNumber: matchedGuest!.idNumber || prev.idNumber || "",
            address: matchedGuest!.address || prev.address || "",
            preferences: matchedGuest!.preferences || prev.preferences || [],
            loyaltyPoints: matchedGuest!.loyaltyPoints || 0,
            totalStays: matchedGuest!.totalStays || 0,
          };
        });
      } else if (form.guestId) {
        setForm((prev) => ({
          ...prev,
          guestId: "",
          loyaltyPoints: 0,
          totalStays: 0,
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.mobile, form.email, form.firstName, form.lastName, form.idNumber, form.guestId]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const nights = useMemo(
    () => nightsBetween(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut],
  );

  const roomRate = useMemo(() => {
    if (form.tariffPlan && tariffByPlanMap[form.tariffPlan]) return tariffByPlanMap[form.tariffPlan];
    if (form.roomType && baseRateByRoomMap[form.roomType]) return baseRateByRoomMap[form.roomType];
    return 0;
  }, [form.tariffPlan, form.roomType, tariffByPlanMap, baseRateByRoomMap]);

  const totalAmount = nights * roomRate;
  const pendingAmount = Math.max(0, totalAmount - form.advancePaid);

  const filteredRooms = useMemo(() => {
    if (!form.roomType) return availableRoomNos;
    return roomsByType[form.roomType] ?? [];
  }, [form.roomType, availableRoomNos, roomsByType]);

  const completion = useMemo(() => {
    const fields = [
      form.firstName, form.lastName, form.mobile,
      form.checkIn, form.checkOut, form.roomType,
    ];
    const filled = fields.filter((f) => String(f).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const currentStep: Step = savedStatus
    ? "done"
    : !form.firstName || !form.lastName || !form.mobile
      ? "guest"
      : !form.checkIn || !form.checkOut || !form.roomType
        ? "booking"
        : "payment";

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const update = (field: string, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "roomType") next.roomNumber = "";
      if (field === "checkIn" && typeof value === "string") {
        if (next.checkOut && next.checkOut <= value) {
          next.checkOut = getNextDayString(value);
        }
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSavedStatus(null);
  };

  const validate = () => {
    const today = getTodayString();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!form.mobile.trim()) next.mobile = "Required";
    if (!form.email.trim()) next.email = "Required";
    if (!form.bookingType) next.bookingType = "Required";
    if (form.bookingType === "Company" && !form.companyId)
      next.companyName = "Please select a company";
    if (!form.checkIn) {
      next.checkIn = "Required";
    } else if (form.checkIn < today) {
      next.checkIn = "Check-in date cannot be in the past";
    }
    if (!form.checkOut) {
      next.checkOut = "Required";
    } else if (form.checkOut < today) {
      next.checkOut = "Check-out date cannot be in the past";
    } else if (form.checkIn && form.checkOut <= form.checkIn) {
      next.checkOut = "Check-out date must be after check-in date";
    }
    if (!form.roomType) next.roomType = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setToastVariant("error");
      setToast("Please fill in all required fields marked with *.");
      return;
    }

    try {
      let finalGuestId = form.guestId;
      const guestNameStr = `${form.firstName} ${form.lastName}`;

      if (finalGuestId) {
        await guestService.update(finalGuestId, {
          name: guestNameStr,
          mobile: form.mobile,
          email: form.email,
          nationality: form.nationality || "Indian",
          gender: form.gender || "",
          dob: form.dob || "",
          address: form.address || "",
          city: form.city || "",
          state: form.state || "",
          country: form.country || "",
          pincode: form.pincode || "",
          idType: form.idProofType || "Aadhaar",
          idNumber: form.idNumber || "",
          preferences: form.preferences?.length ? form.preferences : [],
        });
      } else {
        const created = await guestService.create({
          name: guestNameStr,
          mobile: form.mobile,
          email: form.email,
          nationality: form.nationality || "Indian",
          gender: form.gender || "",
          dob: form.dob || "",
          address: form.address || "",
          city: form.city || "",
          state: form.state || "",
          country: form.country || "",
          pincode: form.pincode || "",
          totalStays: 1,
          loyaltyPoints: 100,
          idType: form.idProofType || "Aadhaar",
          idNumber: form.idNumber || "",
          memberSince: new Date().toLocaleString("en-IN", { month: "short", year: "numeric" }),
          preferences: form.preferences || [],
        });
        finalGuestId = created.id;
      }

      const booking = await reservationService.create({
        guestId: finalGuestId!,
        roomRefId: form.roomNumber || undefined,
        sourceId: form.source || undefined,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        nights,
        adults: form.adults,
        children: form.children,
        tariffPlan: form.tariffPlan || "BAR",
        mealPlan: form.mealPlan || "EP",
        roomRate,
        totalAmount,
        advancePaid: form.advancePaid,
        paymentMode: form.paymentMode || "Cash",
        balance: pendingAmount,
        status: "Reserved",
        bookedBy: currentUser.name,
        bookingType: form.bookingType,
        companyName: form.companyName,
        specialRequests: form.notes || undefined,
      });

      setSavedStatus("Reserved");
      setSavedBookingNo(displayBookingNo(booking));
      setToastVariant("success");
      setToast(
        `Reservation ${displayBookingNo(booking)} saved as Reserved for ${form.firstName} ${form.lastName}. Total: ${formatINR(totalAmount)}`,
      );
    } catch (e) {
      setToastVariant("error");
      setToast(e instanceof Error ? e.message : "Failed to save reservation");
    }
  };

  const guestName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Guest";

  return (
    <div className="space-y-6">
      {toast && (
        <AlertBanner variant={toastVariant} message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Reservations"
        title="New Reservation"
        description="Capture essential guest contact and booking details. Full guest profile is completed at check-in."
        badge={
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2.5">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Booking No.</p>
              <p className="text-sm font-bold text-slate-800">Assigned on save</p>
            </div>
          </div>
        }
      />

      {/* Stepper */}
      {!savedStatus && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Form progress</span>
            <span className="font-semibold text-emerald-700">{completion}% complete</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            {steps.slice(0, 3).map((step, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={step.id} className="flex min-w-0 flex-1 items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isDone && "bg-emerald-500 text-white",
                      isActive && !isDone && "bg-emerald-700 text-white ring-4 ring-emerald-100",
                      !isActive && !isDone && "bg-slate-100 text-slate-400",
                    )}>
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.num}
                    </div>
                    <span className={cn("hidden text-xs font-medium sm:block", isActive ? "text-emerald-700" : isDone ? "text-emerald-600" : "text-slate-400")}>
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={cn("mx-2 h-0.5 min-w-[12px] flex-1 rounded-full", i < stepIndex ? "bg-emerald-300" : "bg-slate-200")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {savedStatus ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xl font-bold text-slate-900">Reservation Saved</p>
          <p className="mt-1 text-sm text-slate-600">
            {savedBookingNo} · {guestName} · {savedStatus}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">{formatINR(totalAmount)} total</p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>New Reservation</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => window.history.back()}>Back to List</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form columns */}
          <div className="space-y-5 lg:col-span-2">
            <SectionCard icon={User} title="Guest Details" description="Basic contact only — ID, address, and other details are collected at check-in">
              <FormField label="First Name" required>
                <TextInput className={inputClass} placeholder="Enter first name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </FormField>
              <FormField label="Last Name" required>
                <TextInput className={inputClass} placeholder="Enter last name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </FormField>
              <FormField label="Mobile" required>
                <TextInput
                  className={inputClass}
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                />
                {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
              </FormField>
              <FormField label="Email" required>
                <TextInput className={inputClass} type="email" placeholder="Enter email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </FormField>
              <FormField label="Booking Type" required>
                <SearchSelect
                  options={[...bookingTypeOptions]}
                  selectedId={form.bookingType || null}
                  placeholder="Search booking type…"
                  inputClassName={inputClass}
                  onSelect={(option) => {
                    update("bookingType", option.id);
                    if (option.id === "Individual") {
                      update("companyName", "");
                      update("companyId", "");
                    }
                  }}
                  onClear={() => {
                    update("bookingType", "");
                    update("companyName", "");
                    update("companyId", "");
                  }}
                />
                {errors.bookingType && <p className="text-xs text-red-500">{errors.bookingType}</p>}
              </FormField>
              {form.bookingType === "Company" && (
                <FormField label="Company" required className="sm:col-span-2">
                  <CompanySearchSelect
                    value={form.companyName}
                    selectedCompanyId={form.companyId || null}
                    onChange={(v) => {
                      update("companyName", v);
                      update("companyId", "");
                    }}
                    onSelect={(c) => {
                      update("companyName", c.name);
                      update("companyId", c.id);
                    }}
                    onClear={() => {
                      update("companyName", "");
                      update("companyId", "");
                    }}
                    placeholder="Search company name or code…"
                    inputClassName={inputClass}
                  />
                  {errors.companyName && <p className="text-xs text-red-500">{errors.companyName}</p>}
                </FormField>
              )}
            </SectionCard>

            <SectionCard icon={BedDouble} title="Booking Details" description="Stay dates, room allocation, and tariff plan">
              <FormField label="Check-in Date" required>
                <TextInput
                  className={inputClass}
                  type="date"
                  min={todayStr}
                  value={form.checkIn}
                  onChange={(e) => update("checkIn", e.target.value)}
                />
                {errors.checkIn && <p className="text-xs text-red-500">{errors.checkIn}</p>}
              </FormField>
              <FormField label="Check-out Date" required>
                <TextInput
                  className={inputClass}
                  type="date"
                  min={form.checkIn || todayStr}
                  value={form.checkOut}
                  onChange={(e) => update("checkOut", e.target.value)}
                />
                {errors.checkOut && <p className="text-xs text-red-500">{errors.checkOut}</p>}
              </FormField>
              <FormField label="Nights">
                <TextInput className={cn(inputClass, "bg-slate-50")} type="number" value={nights} readOnly />
              </FormField>
              <FormField label="Adults">
                <TextInput className={inputClass} type="number" min={1} value={form.adults} onChange={(e) => update("adults", Number(e.target.value))} />
              </FormField>
              <FormField label="Children">
                <TextInput className={inputClass} type="number" min={0} value={form.children} onChange={(e) => update("children", Number(e.target.value))} />
              </FormField>
              <FormField label="Room Type" required>
                <SearchSelect
                  options={roomTypeOptions.map((t) => ({ id: t, label: t }))}
                  selectedId={form.roomType || null}
                  placeholder="Search room type…"
                  inputClassName={inputClass}
                  onSelect={(opt) => update("roomType", opt.id)}
                  onClear={() => update("roomType", "")}
                />
                {errors.roomType && <p className="text-xs text-red-500">{errors.roomType}</p>}
              </FormField>
              <FormField label="Room Number">
                <SearchSelect
                  options={filteredRooms.map((r) => ({
                    id: r,
                    label: `Room ${r}`,
                    hint: form.roomType || undefined,
                  }))}
                  selectedId={form.roomNumber || null}
                  placeholder={
                    form.roomType
                      ? "Search vacant room…"
                      : "Select a room type first…"
                  }
                  inputClassName={inputClass}
                  onSelect={(opt) => update("roomNumber", opt.id)}
                  onClear={() => update("roomNumber", "")}
                />
                {form.roomType && filteredRooms.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No vacant {form.roomType} rooms — booking will be saved as TBA.
                  </p>
                )}
              </FormField>
              <FormField label="Tariff Plan">
                <SearchSelect
                  options={
                    tariffPlanOptions.length > 0
                      ? tariffPlanOptions
                      : tariffPlans.map((p) => ({
                        id: p,
                        label: p,
                        hint: `${formatINR(tariffByPlanMap[p] ?? 0)}/night`,
                      }))
                  }
                  selectedId={form.tariffPlan || null}
                  placeholder="Search tariff plan…"
                  inputClassName={inputClass}
                  onSelect={(opt) => {
                    update("tariffPlan", opt.id);
                    const selected = tariffPlanOptions.find((p) => p.id === opt.id);
                    if (selected?.mealPlan && !form.mealPlan) {
                      update("mealPlan", selected.mealPlan);
                    }
                  }}
                  onClear={() => update("tariffPlan", "")}
                />
              </FormField>
              <FormField label="Meal Plan">
                <SearchSelect
                  options={mealPlans.map((m) => ({ id: m, label: m }))}
                  selectedId={form.mealPlan || null}
                  placeholder="Search meal plan…"
                  inputClassName={inputClass}
                  onSelect={(opt) => update("mealPlan", opt.id)}
                  onClear={() => update("mealPlan", "")}
                />
              </FormField>
              <FormField label="Source">
                <SearchSelect
                  options={sourceOptions}
                  selectedId={form.source || null}
                  placeholder="Search source…"
                  inputClassName={inputClass}
                  onSelect={(opt) => update("source", opt.id)}
                  onClear={() => update("source", "")}
                />
              </FormField>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Payment" description="Advance collection and pending balance">
              <FormField label="Advance Paid">
                <TextInput className={inputClass} type="number" min={0} value={form.advancePaid} onChange={(e) => update("advancePaid", Number(e.target.value))} />
              </FormField>
              <FormField label="Payment Mode">
                <SearchSelect
                  options={paymentModes.map((m) => ({ id: m, label: m }))}
                  selectedId={form.paymentMode || null}
                  placeholder="Search payment mode…"
                  inputClassName={inputClass}
                  onSelect={(opt) => update("paymentMode", opt.id)}
                  onClear={() => update("paymentMode", "")}
                />
                {errors.paymentMode && <p className="text-xs text-red-500">{errors.paymentMode}</p>}
              </FormField>
              <FormField label="Pending Amount">
                <TextInput className={cn(inputClass, "bg-slate-50 font-semibold")} type="number" value={pendingAmount} readOnly />
              </FormField>
            </SectionCard>
          </div>

          {/* Sticky summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Booking Summary</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{guestName}</p>
                <p className="text-xs text-slate-500">Auto-assigned on save (BK-0, BK-1, …)</p>

                <div className="mt-4 space-y-2.5 text-sm">
                  {[
                    { icon: CalendarDays, label: "Check-in", value: form.checkIn || "—" },
                    { icon: CalendarDays, label: "Check-out", value: form.checkOut || "—" },
                    { icon: BedDouble, label: "Room", value: form.roomType ? `${form.roomNumber || "TBA"} · ${form.roomType}` : "—" },
                    { icon: Users, label: "Guests", value: form.adults ? `${form.adults} Adult${form.adults !== 1 ? "s" : ""}${form.children ? `, ${form.children} Child${form.children !== 1 ? "ren" : ""}` : ""}` : "—" },
                    { icon: form.bookingType === "Company" ? Building2 : User, label: "Booking Type", value: form.bookingType === "Company" ? `${form.companyName || "Company"}` : form.bookingType === "Individual" ? "Individual" : "—" },
                    { icon: MapPin, label: "Source", value: form.source || "—" },
                    { icon: CheckCircle2, label: "Status", value: "Reserved" },
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

                {nights > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>{formatINR(roomRate)} × {nights} night{nights !== 1 ? "s" : ""}</span>
                      <span>{formatINR(totalAmount)}</span>
                    </div>
                    {form.advancePaid > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Advance paid</span>
                        <span>− {formatINR(form.advancePaid)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-4 text-white">
                  <p className="text-xs font-medium text-emerald-100">Estimated Total</p>
                  <p className="text-2xl font-bold">{nights > 0 ? formatINR(totalAmount) : "—"}</p>
                  {nights > 0 && form.advancePaid > 0 && (
                    <p className="mt-0.5 text-xs text-emerald-200">Pending: {formatINR(pendingAmount)}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
                <Button onClick={handleSave} className="h-11 w-full bg-slate-900 hover:bg-slate-800 cursor-pointer">
                  Save Reservation
                </Button>
                <button type="button" onClick={() => window.history.back()} className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
