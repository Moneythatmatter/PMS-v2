"use client";

import { useMemo, useState } from "react";
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
  bookingSources,
  mealPlans,
  paymentModes,
  ratePlans,
  roomNumbers,
  roomTypes,
} from "@/app/data/frontoffice/constants";
import { CompanySearchSelect } from "@/components/frontoffice/CompanySearchSelect";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
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

const emptyOption = (label: string) => (
  <option value="" disabled hidden>{label}</option>
);

function generateRef() {
  return `BK-${1044 + Math.floor(Math.random() * 100)}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const rateByPlan: Record<string, number> = {
  BAR: 4500,
  Corporate: 3800,
  OTA: 4200,
  Weekend: 5200,
  "Long Stay": 3200,
};

const baseRateByRoom: Record<string, number> = {
  Standard: 3500,
  Deluxe: 5200,
  Suite: 8500,
  Premium: 6200,
};

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
  const [ref] = useState(generateRef);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    bookingType: "" as "" | "Individual" | "Company",
    companyName: "",
    companyId: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    roomType: "",
    roomNumber: "",
    ratePlan: "",
    mealPlan: "",
    source: "",
    advancePaid: 0,
    paymentMode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const nights = useMemo(
    () => nightsBetween(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut],
  );

  const roomRate = useMemo(() => {
    if (form.ratePlan && rateByPlan[form.ratePlan]) return rateByPlan[form.ratePlan];
    if (form.roomType && baseRateByRoom[form.roomType]) return baseRateByRoom[form.roomType];
    return 3500;
  }, [form.ratePlan, form.roomType]);

  const totalAmount = nights * roomRate;
  const pendingAmount = Math.max(0, totalAmount - form.advancePaid);

  const filteredRooms = useMemo(() => {
    if (!form.roomType) return roomNumbers;
    const prefix =
      form.roomType === "Standard" ? "1" :
      form.roomType === "Deluxe" ? "2" :
      form.roomType === "Suite" ? "5" : "";
    return prefix ? roomNumbers.filter((r) => r.startsWith(prefix)) : roomNumbers;
  }, [form.roomType]);

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
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!form.mobile.trim()) next.mobile = "Required";
    if (!form.email.trim()) next.email = "Required";
    if (!form.bookingType) next.bookingType = "Required";
    if (form.bookingType === "Company" && !form.companyId)
      next.companyName = "Please select a company";
    if (!form.checkIn) next.checkIn = "Required";
    if (!form.checkOut) next.checkOut = "Required";
    if (form.checkIn && form.checkOut && nights <= 0)
      next.checkOut = "Must be after check-in";
    if (!form.roomType) next.roomType = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      setToastVariant("error");
      setToast("Please fill in all required fields marked with *.");
      return;
    }
    setSavedStatus("Reserved");
    setToastVariant("success");
    setToast(
      `Reservation ${ref} saved as Reserved for ${form.firstName} ${form.lastName}. Total: ${formatINR(totalAmount)}`,
    );
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
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Reference</p>
              <p className="text-sm font-bold text-slate-800">{ref}</p>
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
            {ref} · {guestName} · {savedStatus}
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
                <TextInput className={inputClass} placeholder="Enter mobile number" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
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

            <SectionCard icon={BedDouble} title="Booking Details" description="Stay dates, room allocation, and rate plan">
              <FormField label="Check-in Date" required>
                <TextInput className={inputClass} type="date" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} />
                {errors.checkIn && <p className="text-xs text-red-500">{errors.checkIn}</p>}
              </FormField>
              <FormField label="Check-out Date" required>
                <TextInput className={inputClass} type="date" value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} />
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
                <SelectInput className={inputClass} value={form.roomType} onChange={(e) => update("roomType", e.target.value)}>
                  {emptyOption("Select room type")}
                  {roomTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectInput>
                {errors.roomType && <p className="text-xs text-red-500">{errors.roomType}</p>}
              </FormField>
              <FormField label="Room Number">
                <SelectInput className={inputClass} value={form.roomNumber} onChange={(e) => update("roomNumber", e.target.value)}>
                  {emptyOption("Select room number")}
                  {filteredRooms.map((r) => <option key={r} value={r}>{r}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Rate Plan">
                <SelectInput className={inputClass} value={form.ratePlan} onChange={(e) => update("ratePlan", e.target.value)}>
                  {emptyOption("Select rate plan")}
                  {ratePlans.map((p) => <option key={p} value={p}>{p} — {formatINR(rateByPlan[p] ?? 3500)}/night</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Meal Plan">
                <SelectInput className={inputClass} value={form.mealPlan} onChange={(e) => update("mealPlan", e.target.value)}>
                  {emptyOption("Select meal plan")}
                  {mealPlans.map((m) => <option key={m} value={m}>{m}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Source">
                <SelectInput className={inputClass} value={form.source} onChange={(e) => update("source", e.target.value)}>
                  {emptyOption("Select source")}
                  {bookingSources.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </FormField>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Payment" description="Advance collection and pending balance">
              <FormField label="Advance Paid">
                <TextInput className={inputClass} type="number" min={0} value={form.advancePaid} onChange={(e) => update("advancePaid", Number(e.target.value))} />
              </FormField>
              <FormField label="Payment Mode">
                <SelectInput className={inputClass} value={form.paymentMode} onChange={(e) => update("paymentMode", e.target.value)}>
                  {emptyOption("Select payment mode")}
                  {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
                </SelectInput>
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
                <p className="text-xs text-slate-500">{ref}</p>

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
                <Button onClick={handleSave} className="h-11 w-full bg-slate-900 hover:bg-slate-800">
                  Save Reservation
                </Button>
                <button type="button" onClick={() => window.history.back()} className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
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
