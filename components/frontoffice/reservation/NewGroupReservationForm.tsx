"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SelectInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { SearchSelect, RoomTypeAvailabilityOption } from "@/components/frontoffice/SearchSelect";
import { CompanySearchSelect } from "@/components/frontoffice/CompanySearchSelect";
import { groupService } from "@/services/front-office/groups";
import {
  reservationService,
  roomService,
  roomTypeService,
  tariffPlanService,
} from "@/services/front-office";
import type { ReservationBooking } from "@/app/data/types/frontoffice";
import type { RoomAvailabilityBlock } from "@/services/front-office/rooms";
import {
  filterRoomsForStay,
  isRoomVacantStatus,
} from "@/lib/room-availability";
import {
  paymentModes,
  reservationPaymentModesNeedingExternalRef,
} from "@/app/data/frontoffice/constants";
import { ApiError } from "@/services/api";
import { cn } from "@/lib/utils";

const inputClass = "rounded-xl";

type RoomLineDraft = {
  roomType: string;
  adults: string;
  children: string;
  tariffPlan: string;
};

type RoomTypeOption = { name: string; baseRate: number };

type TariffOption = {
  id: string;
  label: string;
  hint: string;
  baseRate: number;
  mealPlan?: string;
  roomTypeScope: string;
};

type ChargeCategory =
  | "ROOM"
  | "FOOD_BEVERAGE"
  | "MINIBAR"
  | "LAUNDRY"
  | "OTHER";

type BillingResponsibility = "GROUP_OWNER" | "GUEST";
type BillingPreset = "OWNER_PAYS_ROOM" | "OWNER_PAYS_ALL" | "CUSTOM";
type BillingRulesMap = Record<ChargeCategory, BillingResponsibility>;

const CHARGE_CATEGORIES: Array<{ key: ChargeCategory; label: string }> = [
  { key: "ROOM", label: "Room Charges" },
  { key: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { key: "MINIBAR", label: "Minibar" },
  { key: "LAUNDRY", label: "Laundry" },
  { key: "OTHER", label: "Other" },
];

const PRESET_OWNER_PAYS_ROOM: BillingRulesMap = {
  ROOM: "GROUP_OWNER",
  FOOD_BEVERAGE: "GUEST",
  MINIBAR: "GUEST",
  LAUNDRY: "GUEST",
  OTHER: "GUEST",
};

const PRESET_OWNER_PAYS_ALL: BillingRulesMap = {
  ROOM: "GROUP_OWNER",
  FOOD_BEVERAGE: "GROUP_OWNER",
  MINIBAR: "GROUP_OWNER",
  LAUNDRY: "GROUP_OWNER",
  OTHER: "GROUP_OWNER",
};

const EMPTY_LINE: RoomLineDraft = {
  roomType: "",
  adults: "",
  children: "",
  tariffPlan: "",
};

function matchBillingPreset(rules: BillingRulesMap): BillingPreset {
  const keys = CHARGE_CATEGORIES.map((c) => c.key);
  if (keys.every((k) => rules[k] === PRESET_OWNER_PAYS_ROOM[k])) {
    return "OWNER_PAYS_ROOM";
  }
  if (keys.every((k) => rules[k] === PRESET_OWNER_PAYS_ALL[k])) {
    return "OWNER_PAYS_ALL";
  }
  return "CUSTOM";
}

function billingRulesToPayload(rules: BillingRulesMap) {
  return CHARGE_CATEGORIES.map(({ key }) => ({
    chargeCategory: key,
    responsibility: rules[key],
  }));
}

function tariffAppliesToRoomType(planRoomType: string, roomType: string) {
  const scope = String(planRoomType ?? "").trim().toLowerCase();
  if (!scope || scope === "all types" || scope === "all") return true;
  const wanted = roomType.trim().toLowerCase();
  return scope
    .split(/[,/|]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .some((p) => p === wanted || p.includes(wanted) || wanted.includes(p));
}

function nightsBetween(arrival: string, departure: string) {
  const a = Date.parse(arrival);
  const b = Date.parse(departure);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NewGroupReservationForm() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [tariffOptions, setTariffOptions] = useState<TariffOption[]>([]);
  const [roomsByType, setRoomsByType] = useState<Record<string, string[]>>({});
  const [reservations, setReservations] = useState<ReservationBooking[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<
    RoomAvailabilityBlock[]
  >([]);

  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [lines, setLines] = useState<RoomLineDraft[]>([{ ...EMPTY_LINE }]);
  const [billingPreset, setBillingPreset] =
    useState<BillingPreset>("OWNER_PAYS_ROOM");
  const [billingRules, setBillingRules] = useState<BillingRulesMap>({
    ...PRESET_OWNER_PAYS_ROOM,
  });
  const [advancePaid, setAdvancePaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("");
  const [externalReference, setExternalReference] = useState("");

  const [savedGroupId, setSavedGroupId] = useState<string | null>(null);
  const [savedGroupNo, setSavedGroupNo] = useState<string | null>(null);

  const nights = useMemo(
    () => nightsBetween(arrivalDate, departureDate),
    [arrivalDate, departureDate],
  );
  const todayStr = useMemo(() => getTodayString(), []);

  const availableByType = useMemo(() => {
    const map: Record<string, number> = {};
    if (!arrivalDate || !departureDate) {
      for (const [type, roomNos] of Object.entries(roomsByType)) {
        map[type] = roomNos.length;
      }
      return map;
    }
    for (const [type, roomNos] of Object.entries(roomsByType)) {
      map[type] = filterRoomsForStay(
        roomNos,
        reservations,
        arrivalDate,
        departureDate,
        availabilityBlocks,
      ).length;
    }
    return map;
  }, [
    roomsByType,
    reservations,
    arrivalDate,
    departureDate,
    availabilityBlocks,
  ]);

  const roomTypeSelectOptions = useMemo(
    () =>
      roomTypes.map((rt) => ({
        id: rt.name,
        label: rt.name,
        hint: `${availableByType[rt.name] ?? 0}`,
      })),
    [roomTypes, availableByType],
  );

  function tariffOptionsForRoomType(roomType: string) {
    if (!roomType) return tariffOptions;
    const filtered = tariffOptions.filter((t) =>
      tariffAppliesToRoomType(t.roomTypeScope, roomType),
    );
    return filtered.length > 0 ? filtered : tariffOptions;
  }

  function resolveLineRate(line: RoomLineDraft) {
    const plan = tariffOptions.find((p) => p.id === line.tariffPlan);
    if (plan) return plan.baseRate;
    return roomTypes.find((t) => t.name === line.roomType)?.baseRate ?? 0;
  }

  const roomLinesFilled = lines.filter((l) => l.roomType);
  const estimatedTotal = roomLinesFilled.reduce((sum, line) => {
    return sum + resolveLineRate(line) * Math.max(nights, 1);
  }, 0);
  const pendingAmount = Math.max(0, estimatedTotal - advancePaid);
  const showExternalReference =
    reservationPaymentModesNeedingExternalRef.has(paymentMode);

  const loadMasters = useCallback(async () => {
    const [types, roomCards, reservationList, tariffData] = await Promise.all([
      roomTypeService.list().catch(() => []),
      roomService.status().catch(() => []),
      reservationService.list().catch(() => []),
      tariffPlanService.list().catch(() => []),
    ]);
    setReservations(reservationList);

    const plans: TariffOption[] = (
      tariffData as Array<{
        name?: string;
        code?: string;
        baseRate?: number;
        mealPlan?: string;
        roomType?: string;
        status?: string;
      }>
    )
      .filter((rp) => rp.status !== "Inactive")
      .map((rp) => {
        const id = String(rp.name || rp.code || "").trim();
        const label =
          rp.name && rp.code && rp.name !== rp.code
            ? `${rp.name} (${rp.code})`
            : rp.name || rp.code || id;
        return {
          id,
          label,
          hint: formatINR(Number(rp.baseRate ?? 0)),
          baseRate: Number(rp.baseRate ?? 0),
          mealPlan: rp.mealPlan,
          roomTypeScope: String(rp.roomType ?? "All Types"),
        };
      })
      .filter((p) => p.id);
    setTariffOptions(plans);

    const byType: Record<string, string[]> = {};
    for (const r of roomCards) {
      if (!isRoomVacantStatus(r.status)) continue;
      const key = String(r.type ?? "").trim() || "Other";
      if (!byType[key]) byType[key] = [];
      byType[key].push(r.roomNo);
    }
    for (const key of Object.keys(byType)) {
      byType[key].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
    }
    setRoomsByType(byType);

    const typeOptions: RoomTypeOption[] = [];
    for (const rt of types as Array<{
      name?: string;
      baseRate?: number;
      status?: string;
    }>) {
      const name = String(rt.name ?? "").trim();
      if (!name || rt.status === "Inactive") continue;
      typeOptions.push({ name, baseRate: Number(rt.baseRate ?? 0) });
    }
    for (const r of roomCards) {
      const name = String(r.type ?? "").trim();
      if (name && !typeOptions.some((t) => t.name === name)) {
        typeOptions.push({ name, baseRate: 0 });
      }
    }
    typeOptions.sort((a, b) => a.name.localeCompare(b.name));
    setRoomTypes(typeOptions);
  }, []);

  useEffect(() => {
    void loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    let cancelled = false;
    if (!arrivalDate || !departureDate) return;
    (async () => {
      try {
        const blocks = await roomService.blocks(arrivalDate, departureDate);
        if (!cancelled) setAvailabilityBlocks(blocks);
      } catch {
        if (!cancelled) setAvailabilityBlocks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [arrivalDate, departureDate]);

  function selectRoomType(idx: number, roomType: string) {
    const applicable = tariffOptions.filter((p) =>
      tariffAppliesToRoomType(p.roomTypeScope, roomType),
    );
    const preferred = applicable[0] ?? tariffOptions[0];
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              roomType,
              adults: l.adults || "1",
              children: l.children || "0",
              tariffPlan: preferred?.id ?? "",
            }
          : l,
      ),
    );
  }

  function validateGroupStep() {
    const next: Record<string, string> = {};
    if (!groupName.trim()) next.groupName = "Group name is required";
    if (!groupType.trim()) next.groupType = "Group type is required";
    if (!contactName.trim()) {
      next.contactName = "Group owner / contact name is required";
    }
    if (
      (groupType === "Company" || groupType === "Corporate") &&
      !companyId &&
      !companyName.trim()
    ) {
      next.companyName = "Please select a company";
    }
    if (contactPhone.trim() && contactPhone.trim().length !== 10) {
      next.contactPhone = "Phone number must be 10 digits";
    }
    if (
      contactEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
    ) {
      next.contactEmail = "Enter a valid email address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateRoomsStep() {
    const next: Record<string, string> = {};
    const today = todayStr;
    if (!arrivalDate) {
      next.arrivalDate = "Arrival date is required";
    } else if (arrivalDate < today) {
      next.arrivalDate = "Arrival date cannot be in the past";
    }
    if (!departureDate) {
      next.departureDate = "Departure date is required";
    } else if (departureDate < today) {
      next.departureDate = "Departure date cannot be in the past";
    } else if (arrivalDate && departureDate && nights < 1) {
      next.departureDate = "Departure must be after arrival";
    }
    const filled = lines.filter((l) => l.roomType);
    if (!filled.length) next.rooms = "Add at least one room line";

    for (const line of filled) {
      if (!line.tariffPlan) {
        next.rooms = `${line.roomType}: select a tariff plan`;
        break;
      }
      if (Number(line.adults || 0) + Number(line.children || 0) < 1) {
        next.rooms = `${line.roomType}: enter at least 1 adult or child`;
        break;
      }
    }

    const demand: Record<string, number> = {};
    for (const line of filled) {
      demand[line.roomType] = (demand[line.roomType] ?? 0) + 1;
    }
    for (const [type, qty] of Object.entries(demand)) {
      const available = availableByType[type] ?? 0;
      if (qty > available) {
        next.rooms = `${type}: ${qty} rooms requested, only ${available} available`;
        break;
      }
    }

    if (advancePaid > 0) {
      if (!paymentMode.trim()) {
        next.paymentMode = "Required when advance is collected";
      }
      if (
        paymentMode.trim() &&
        reservationPaymentModesNeedingExternalRef.has(paymentMode) &&
        !externalReference.trim()
      ) {
        next.externalReference =
          paymentMode === "UPI"
            ? "Required — enter UPI transaction ID from your payment app"
            : "Required — enter card auth / reference from POS or bank";
      }
    }
    if (advancePaid > estimatedTotal && estimatedTotal > 0) {
      next.advancePaid = "Advance cannot exceed estimated total";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validateGroupStep() || !validateRoomsStep()) {
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      const roomLines = lines
        .filter((l) => l.roomType)
        .map((l) => {
          const plan = tariffOptions.find((p) => p.id === l.tariffPlan);
          return {
            roomType: l.roomType,
            quantity: 1,
            roomRate: resolveLineRate(l),
            tariffPlan: l.tariffPlan || undefined,
            mealPlan: plan?.mealPlan,
            adults: Math.max(0, Number(l.adults) || 0),
            children: Math.max(0, Number(l.children) || 0),
          };
        });

      const result = await groupService.create({
        groupName: groupName.trim(),
        groupType,
        companyName: companyName.trim() || null,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        arrivalDate,
        departureDate,
        nights: Math.max(nights, 1),
        idempotencyKey:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `grp-${Date.now()}`,
        roomLines,
        billingRules: billingRulesToPayload(billingRules),
        advancePaid: advancePaid > 0 ? advancePaid : undefined,
        paymentMode: advancePaid > 0 ? paymentMode : undefined,
        externalReference:
          advancePaid > 0 && externalReference.trim()
            ? externalReference.trim()
            : undefined,
      });

      setSavedGroupId(result.groupId);
      setSavedGroupNo(result.group?.groupNo ?? null);
      setSaved(true);
      setToastVariant("success");
      setToast("Group booking created successfully.");
    } catch (e) {
      setToastVariant("error");
      setToast(e instanceof ApiError ? e.message : "Failed to create group");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative space-y-6">
      {saving ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">
                Creating group booking…
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Child rooms and master folio are being prepared
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <AlertBanner
          variant={toastVariant}
          message={toast}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <FOPageHeader
        eyebrow="Reservations"
        title="New Group Reservation"
        description="Capture group owner contact, room lines, and billing rules. Guests can be assigned at check-in."
        badge={
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2.5">
            <Users className="h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Group No.
              </p>
              <p className="text-sm font-bold text-slate-800">
                {savedGroupNo ?? "Assigned on save"}
              </p>
            </div>
          </div>
        }
      />

      {saved ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xl font-bold text-slate-900">
            Group Booking Saved
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {savedGroupNo ?? "Group"} · {groupName} · {roomLinesFilled.length}{" "}
            room{roomLinesFilled.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            {formatINR(estimatedTotal)} estimated
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              New Reservation
            </Button>
            {savedGroupId ? (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() =>
                  router.push(`/frontoffice/group-booking/${savedGroupId}`)
                }
              >
                Open group
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <SectionCard
                icon={Users}
                title="Group Details"
                description="Group owner is the contact / payer — not auto-assigned as guest on every room."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="Group name"
                    required
                    className="sm:col-span-2"
                  >
                    <TextInput
                      className="rounded-xl"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Acme Corp Offsite"
                    />
                    {errors.groupName ? (
                      <p className="text-xs text-red-500">{errors.groupName}</p>
                    ) : null}
                  </FormField>
                  <FormField label="Group type" required>
                    <SelectInput
                      className="rounded-xl"
                      value={groupType}
                      onChange={(e) => {
                        const next = e.target.value;
                        setGroupType(next);
                        if (next !== "Company" && next !== "Corporate") {
                          setCompanyName("");
                          setCompanyId("");
                        }
                      }}
                    >
                      <option value="">Select type</option>
                      <option value="Company">Company</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Tour">Tour</option>
                      <option value="Other">Other</option>
                    </SelectInput>
                    {errors.groupType ? (
                      <p className="text-xs text-red-500">{errors.groupType}</p>
                    ) : null}
                  </FormField>
                  {groupType === "Company" || groupType === "Corporate" ? (
                    <FormField
                      label="Company"
                      required
                      className="sm:col-span-2"
                    >
                      <CompanySearchSelect
                        value={companyName}
                        selectedCompanyId={companyId || null}
                        onChange={(v) => {
                          setCompanyName(v);
                          setCompanyId("");
                        }}
                        onSelect={(c) => {
                          setCompanyName(c.name);
                          setCompanyId(c.id);
                        }}
                        onClear={() => {
                          setCompanyName("");
                          setCompanyId("");
                        }}
                        placeholder="Search company name or code…"
                        inputClassName={inputClass}
                      />
                      {errors.companyName ? (
                        <p className="text-xs text-red-500">
                          {errors.companyName}
                        </p>
                      ) : null}
                    </FormField>
                  ) : null}
                  <FormField label="Group owner / contact" required>
                    <TextInput
                      className="rounded-xl"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Owner name"
                    />
                    {errors.contactName ? (
                      <p className="text-xs text-red-500">
                        {errors.contactName}
                      </p>
                    ) : null}
                  </FormField>
                  <FormField label="Contact phone">
                    <TextInput
                      className="rounded-xl"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={10}
                      value={contactPhone}
                      onChange={(e) =>
                        setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit mobile"
                    />
                    {errors.contactPhone ? (
                      <p className="text-xs text-red-500">
                        {errors.contactPhone}
                      </p>
                    ) : null}
                  </FormField>
                  <FormField label="Contact email">
                    <TextInput
                      className="rounded-xl"
                      type="email"
                      autoComplete="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="owner@company.com"
                    />
                    {errors.contactEmail ? (
                      <p className="text-xs text-red-500">
                        {errors.contactEmail}
                      </p>
                    ) : null}
                  </FormField>
                </div>
              </SectionCard>

            <SectionCard
                icon={CalendarDays}
                title="Rooms & Stay"
                description="Add one line per room. Guests stay unassigned until check-in."
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setLines((prev) => [...prev, { ...EMPTY_LINE }])
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add room
                  </Button>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField label="Arrival" required>
                      <TextInput
                        className="rounded-xl"
                        type="date"
                        min={todayStr}
                        value={arrivalDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          setArrivalDate(next);
                          if (departureDate && next && departureDate <= next) {
                            setDepartureDate("");
                          }
                        }}
                      />
                      {errors.arrivalDate ? (
                        <p className="text-xs text-red-500">
                          {errors.arrivalDate}
                        </p>
                      ) : null}
                    </FormField>
                    <FormField label="Departure" required>
                      <TextInput
                        className="rounded-xl"
                        type="date"
                        min={arrivalDate || todayStr}
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                      />
                      {errors.departureDate ? (
                        <p className="text-xs text-red-500">
                          {errors.departureDate}
                        </p>
                      ) : null}
                    </FormField>
                    <FormField label="Nights">
                      <TextInput
                        className="rounded-xl bg-slate-50"
                        value={nights > 0 ? String(nights) : ""}
                        readOnly
                        placeholder="—"
                      />
                    </FormField>
                  </div>

                  {errors.rooms ? (
                    <p className="text-sm text-red-600">{errors.rooms}</p>
                  ) : null}

                  {lines.map((line, idx) => {
                    const roomsOfType = line.roomType
                      ? lines.filter((l) => l.roomType === line.roomType)
                          .length
                      : 0;
                    const available = line.roomType
                      ? (availableByType[line.roomType] ?? 0)
                      : 0;
                    const over =
                      Boolean(line.roomType) &&
                      Boolean(arrivalDate) &&
                      Boolean(departureDate) &&
                      roomsOfType > available;
                    const rate = resolveLineRate(line);

                    return (
                      <div
                        key={idx}
                        className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                      >
                        <div className="grid gap-2 sm:grid-cols-[1.3fr_0.45fr_0.45fr_1.2fr_auto]">
                          <FormField label="Room type">
                            <SearchSelect
                              options={roomTypeSelectOptions}
                              selectedId={line.roomType || null}
                              placeholder="Search room type…"
                              lockInputWhenSelected
                              onSelect={(opt) => selectRoomType(idx, opt.id)}
                              onClear={() =>
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx ? { ...EMPTY_LINE } : l,
                                  ),
                                )
                              }
                              renderOption={(opt) => (
                                <RoomTypeAvailabilityOption
                                  label={opt.label}
                                  count={Number(opt.hint ?? 0)}
                                />
                              )}
                            />
                          </FormField>
                          <FormField label="Adult">
                            <TextInput
                              className="rounded-xl"
                              type="number"
                              min={0}
                              value={line.adults}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? { ...l, adults: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                            />
                          </FormField>
                          <FormField label="Child">
                            <TextInput
                              className="rounded-xl"
                              type="number"
                              min={0}
                              value={line.children}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? { ...l, children: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                            />
                          </FormField>
                          <FormField label="Tariff plan">
                            <SearchSelect
                              options={tariffOptionsForRoomType(line.roomType)}
                              selectedId={line.tariffPlan || null}
                              placeholder="Select tariff…"
                              lockInputWhenSelected
                              disabled={!line.roomType}
                              onSelect={(opt) =>
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? { ...l, tariffPlan: opt.id }
                                      : l,
                                  ),
                                )
                              }
                              onClear={() =>
                                setLines((prev) =>
                                  prev.map((l, i) =>
                                    i === idx ? { ...l, tariffPlan: "" } : l,
                                  ),
                                )
                              }
                            />
                          </FormField>
                          <div className="flex items-end pb-0.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-10 w-10 shrink-0 px-0"
                              disabled={lines.length <= 1}
                              onClick={() =>
                                setLines((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                              aria-label="Remove room line"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {line.roomType ? (
                          <p
                            className={cn(
                              "text-xs",
                              over
                                ? "font-medium text-red-600"
                                : "text-slate-500",
                            )}
                          >
                            {arrivalDate && departureDate
                              ? `${available}/${roomsByType[line.roomType]?.length ?? 0} available`
                              : "Set dates to check availability"}
                            {line.tariffPlan
                              ? ` · ${formatINR(rate)}/night`
                              : ""}
                            {over ? ` — too many ${line.roomType} lines` : ""}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

            <SectionCard
                icon={Wallet}
                title="Billing Responsibility"
                description="Who pays for each charge category on this group stay."
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        {
                          id: "OWNER_PAYS_ROOM" as const,
                          label: "Owner Pays Room Only",
                        },
                        {
                          id: "OWNER_PAYS_ALL" as const,
                          label: "Owner Pays Everything",
                        },
                        { id: "CUSTOM" as const, label: "Custom" },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          if (preset.id === "OWNER_PAYS_ROOM") {
                            setBillingRules({ ...PRESET_OWNER_PAYS_ROOM });
                            setBillingPreset("OWNER_PAYS_ROOM");
                          } else if (preset.id === "OWNER_PAYS_ALL") {
                            setBillingRules({ ...PRESET_OWNER_PAYS_ALL });
                            setBillingPreset("OWNER_PAYS_ALL");
                          } else {
                            setBillingPreset("CUSTOM");
                          }
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                          billingPreset === preset.id
                            ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_minmax(9rem,11rem)] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <span>Charge category</span>
                      <span>Paid by</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {CHARGE_CATEGORIES.map(({ key, label }) => (
                        <li
                          key={key}
                          className="grid grid-cols-[1fr_minmax(9rem,11rem)] items-center gap-2 px-3 py-2.5"
                        >
                          <span className="text-sm text-slate-700">{label}</span>
                          <SelectInput
                            className="rounded-xl"
                            value={billingRules[key]}
                            onChange={(e) => {
                              const next = e.target
                                .value as BillingResponsibility;
                              if (
                                next !== "GROUP_OWNER" &&
                                next !== "GUEST"
                              ) {
                                return;
                              }
                              setBillingRules((prev) => {
                                const updated = { ...prev, [key]: next };
                                setBillingPreset(matchBillingPreset(updated));
                                return updated;
                              });
                            }}
                          >
                            <option value="GROUP_OWNER">Group Owner</option>
                            <option value="GUEST">Guest</option>
                          </SelectInput>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionCard>

            <SectionCard
                icon={CreditCard}
                title="Payment"
                description="Collect advance manually — no payment gateway; enter external transaction ID for UPI / card. Posted to the group master folio."
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Advance Paid">
                    <TextInput
                      className={inputClass}
                      type="number"
                      min={0}
                      value={advancePaid > 0 ? advancePaid : ""}
                      placeholder="Enter advance amount"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setAdvancePaid(0);
                          return;
                        }
                        setAdvancePaid(Math.max(0, Number(raw) || 0));
                      }}
                    />
                    {errors.advancePaid ? (
                      <p className="text-xs text-red-500">{errors.advancePaid}</p>
                    ) : null}
                  </FormField>
                  <FormField label="Payment Mode">
                    <SearchSelect
                      options={paymentModes.map((m) => ({ id: m, label: m }))}
                      selectedId={paymentMode || null}
                      placeholder="Select payment mode…"
                      inputClassName={inputClass}
                      onSelect={(opt) => setPaymentMode(opt.id)}
                      onClear={() => {
                        setPaymentMode("");
                        setExternalReference("");
                      }}
                    />
                    {errors.paymentMode ? (
                      <p className="text-xs text-red-500">{errors.paymentMode}</p>
                    ) : null}
                  </FormField>
                  <FormField label="Pending Amount">
                    <TextInput
                      className={cn(inputClass, "bg-slate-50 font-semibold")}
                      type="text"
                      readOnly
                      value={
                        nights > 0 && roomLinesFilled.length
                          ? String(pendingAmount)
                          : ""
                      }
                      placeholder="Calculated after rooms & dates"
                    />
                  </FormField>
                  {showExternalReference ? (
                    <FormField
                      label="External Reference ID"
                      required={advancePaid > 0}
                      className="sm:col-span-2 lg:col-span-3"
                      helperText={
                        advancePaid > 0
                          ? "Payment was taken outside the PMS — paste the UPI or card transaction ID here"
                          : "Enter advance amount above — then paste the UPI / card transaction ID from your payment app"
                      }
                    >
                      <TextInput
                        className={cn(
                          inputClass,
                          "border-emerald-300 ring-1 ring-emerald-100 focus:border-emerald-500",
                        )}
                        value={externalReference}
                        placeholder={
                          paymentMode === "UPI"
                            ? "e.g. UPI987654321"
                            : "e.g. AUTH123456 or bank ref"
                        }
                        onChange={(e) => setExternalReference(e.target.value)}
                      />
                      {errors.externalReference ? (
                        <p className="text-xs text-red-500">
                          {errors.externalReference}
                        </p>
                      ) : null}
                    </FormField>
                  ) : null}
                </div>
              </SectionCard>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? "Creating…" : "Create group booking"}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Booking Summary
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {groupName.trim() || "Group name"}
                </p>
                <p className="text-xs text-slate-500">
                  Auto-assigned on save (GRP-…)
                </p>

                <div className="mt-4 space-y-2.5 text-sm">
                  {[
                    {
                      icon: User,
                      label: "Group owner",
                      value: contactName.trim() || "—",
                    },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: contactPhone.trim() || "—",
                    },
                    {
                      icon: Mail,
                      label: "Email",
                      value: contactEmail.trim() || "—",
                    },
                    {
                      icon: Building2,
                      label: "Type",
                      value: groupType || "—",
                    },
                    {
                      icon: CalendarDays,
                      label: "Arrival",
                      value: arrivalDate || "—",
                    },
                    {
                      icon: CalendarDays,
                      label: "Departure",
                      value: departureDate || "—",
                    },
                    {
                      icon: Users,
                      label: "Rooms",
                      value: roomLinesFilled.length
                        ? `${roomLinesFilled.length} room${roomLinesFilled.length === 1 ? "" : "s"}`
                        : "—",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="truncate font-medium text-slate-800">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {nights > 0 && roomLinesFilled.length ? (
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Rooms × {nights} night{nights !== 1 ? "s" : ""}
                      </span>
                      <span>{formatINR(estimatedTotal)}</span>
                    </div>
                    {advancePaid > 0 ? (
                      <>
                        <div className="flex justify-between text-emerald-600">
                          <span>Advance amount</span>
                          <span>− {formatINR(advancePaid)}</span>
                        </div>
                        {paymentMode ? (
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Payment method</span>
                            <span>{paymentMode}</span>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 p-4 text-white">
                  <p className="text-xs font-medium text-emerald-100">
                    Estimated Total
                  </p>
                  <p className="text-2xl font-bold">
                    {nights > 0 && roomLinesFilled.length
                      ? formatINR(estimatedTotal)
                      : "—"}
                  </p>
                  {nights > 0 && advancePaid > 0 ? (
                    <p className="mt-0.5 text-xs text-emerald-200">
                      Pending: {formatINR(pendingAmount)}
                    </p>
                  ) : nights > 0 ? (
                    <p className="mt-0.5 text-xs text-emerald-200">
                      {nights} night{nights === 1 ? "" : "s"} · rooms TBA
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="h-11 w-full cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    "Create Group Booking"
                  )}
                </Button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => window.history.back()}
                  className="w-full cursor-pointer py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
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
