"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarRange,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  EmptyState,
  FormField,
  FOPageHeader,
  SelectInput,
  StatMiniCard,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { SearchSelect } from "@/components/frontoffice/SearchSelect";
import {
  groupService,
  type FoGroupDto,
} from "@/services/front-office/groups";
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
import { ApiError } from "@/services/api";
import { cn } from "@/lib/utils";

type RoomLineDraft = {
  roomType: string;
  adults: string;
  children: string;
  tariffPlan: string;
};

type RoomTypeOption = {
  name: string;
  baseRate: number;
};

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

const CHARGE_CATEGORIES: Array<{
  key: ChargeCategory;
  label: string;
}> = [
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

function matchBillingPreset(rules: BillingRulesMap): BillingPreset {
  const keys = CHARGE_CATEGORIES.map((c) => c.key);
  const isRoomOnly = keys.every(
    (k) => rules[k] === PRESET_OWNER_PAYS_ROOM[k],
  );
  if (isRoomOnly) return "OWNER_PAYS_ROOM";
  const isAllOwner = keys.every(
    (k) => rules[k] === PRESET_OWNER_PAYS_ALL[k],
  );
  if (isAllOwner) return "OWNER_PAYS_ALL";
  return "CUSTOM";
}

function billingRulesToPayload(rules: BillingRulesMap) {
  return CHARGE_CATEGORIES.map(({ key }) => ({
    chargeCategory: key,
    responsibility: rules[key],
  }));
}

const EMPTY_LINE: RoomLineDraft = {
  roomType: "",
  adults: "",
  children: "",
  tariffPlan: "",
};

function tariffAppliesToRoomType(planRoomType: string, roomType: string): boolean {
  const scope = String(planRoomType ?? "").trim().toLowerCase();
  if (!scope || scope === "all types" || scope === "all") return true;
  const wanted = roomType.trim().toLowerCase();
  return scope
    .split(/[,/|]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .some((p) => p === wanted || p.includes(wanted) || wanted.includes(p));
}

function nightsBetween(arrival: string, departure: string): number {
  const a = Date.parse(arrival);
  const b = Date.parse(departure);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function statusTone(status?: string) {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("cancel")) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (s.includes("checked out")) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (s.includes("house") || s.includes("partial"))
    return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

export function GroupBookingView() {
  const router = useRouter();
  const [groups, setGroups] = useState<FoGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

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
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [billingPreset, setBillingPreset] =
    useState<BillingPreset>("OWNER_PAYS_ROOM");
  const [billingRules, setBillingRules] = useState<BillingRulesMap>({
    ...PRESET_OWNER_PAYS_ROOM,
  });
  const [lines, setLines] = useState<RoomLineDraft[]>([{ ...EMPTY_LINE }]);

  const nights = useMemo(() => {
    if (!arrivalDate || !departureDate) return "";
    return String(nightsBetween(arrivalDate, departureDate));
  }, [arrivalDate, departureDate]);

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

  function tariffOptionsForRoomType(roomType: string): TariffOption[] {
    if (!roomType) return tariffOptions;
    const filtered = tariffOptions.filter((t) =>
      tariffAppliesToRoomType(t.roomTypeScope, roomType),
    );
    return filtered.length > 0 ? filtered : tariffOptions;
  }

  function resolveLineRate(line: RoomLineDraft): number {
    const plan = tariffOptions.find((p) => p.id === line.tariffPlan);
    if (plan) return plan.baseRate;
    return roomTypes.find((t) => t.name === line.roomType)?.baseRate ?? 0;
  }

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const hay = [
        g.groupName,
        g.groupNo,
        g.companyName,
        g.contactName,
        g.status,
        g.groupType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [groups, query]);

  const stats = useMemo(() => {
    const confirmed = groups.filter((g) => /confirm/i.test(g.status)).length;
    const inHouse = groups.filter((g) =>
      /house|partial/i.test(g.status),
    ).length;
    return { total: groups.length, confirmed, inHouse };
  }, [groups]);

  const resetForm = useCallback(() => {
    setGroupName("");
    setGroupType("");
    setCompanyName("");
    setContactName("");
    setContactPhone("");
    setArrivalDate("");
    setDepartureDate("");
    setBillingPreset("OWNER_PAYS_ROOM");
    setBillingRules({ ...PRESET_OWNER_PAYS_ROOM });
    setLines([{ ...EMPTY_LINE }]);
    setFormError("");
  }, []);

  const openCreate = () => {
    router.push("/frontoffice/reservation/new?mode=group");
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setFormError("");
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, types, roomCards, reservationList, tariffData] =
        await Promise.all([
          groupService.list(),
          roomTypeService.list().catch(() => []),
          roomService.status().catch(() => []),
          reservationService.list().catch(() => []),
          tariffPlanService.list().catch(() => []),
        ]);
      setGroups(g);
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
        typeOptions.push({
          name,
          baseRate: Number(rt.baseRate ?? 0),
        });
      }
      for (const r of roomCards) {
        const name = String(r.type ?? "").trim();
        if (name && !typeOptions.some((t) => t.name === name)) {
          typeOptions.push({ name, baseRate: 0 });
        }
      }
      typeOptions.sort((a, b) => a.name.localeCompare(b.name));
      setRoomTypes(typeOptions);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function handleCreate() {
    setFormError("");
    if (!groupName.trim()) {
      setFormError("Group name is required");
      return;
    }
    if (!groupType.trim()) {
      setFormError("Group type is required");
      return;
    }
    if (!arrivalDate || !departureDate) {
      setFormError("Arrival and departure dates are required");
      return;
    }

    const stayNights = nightsBetween(arrivalDate, departureDate);
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

    if (!roomLines.length) {
      setFormError("Add at least one room line");
      return;
    }

    for (const line of roomLines) {
      if (!line.tariffPlan) {
        setFormError(`${line.roomType}: select a tariff plan`);
        return;
      }
      if (line.adults + line.children < 1) {
        setFormError(`${line.roomType}: enter at least 1 adult or child`);
        return;
      }
    }

    const demand: Record<string, number> = {};
    for (const line of roomLines) {
      demand[line.roomType] = (demand[line.roomType] ?? 0) + 1;
    }
    for (const [type, qty] of Object.entries(demand)) {
      const available = availableByType[type] ?? 0;
      if (qty > available) {
        setFormError(
          `${type}: ${qty} rooms requested, only ${available} available for these dates.`,
        );
        return;
      }
    }

    for (const { key, label } of CHARGE_CATEGORIES) {
      const value = billingRules[key];
      if (value !== "GROUP_OWNER" && value !== "GUEST") {
        setFormError(`${label}: select Group Owner or Guest`);
        return;
      }
    }

    setSaving(true);
    try {
      const result = await groupService.create({
        groupName: groupName.trim(),
        groupType,
        companyName: companyName.trim() || null,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        arrivalDate,
        departureDate,
        nights: stayNights,
        idempotencyKey:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `grp-${Date.now()}`,
        roomLines,
        billingRules: billingRulesToPayload(billingRules),
      });
      closeCreate();
      await load();
      router.push(`/frontoffice/group-booking/${result.groupId}`);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to create group");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title="Group Booking"
        description="View group stays and create multi-room bookings with shared billing."
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {filteredGroups.length} of {groups.length} shown
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create group
            </Button>
          </div>
        }
      />

      {error ? (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Total groups"
          value={stats.total}
          icon={Users}
          accent="#0f766e"
        />
        <StatMiniCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CalendarRange}
          accent="#16a34a"
        />
        <StatMiniCard
          label="In-house / partial"
          value={stats.inHouse}
          icon={Building2}
          accent="#d97706"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search group, company, contact…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Loading groups…
          </p>
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            title={groups.length === 0 ? "No group bookings yet" : "No matches"}
            description={
              groups.length === 0
                ? "Create a group to generate child room reservations and billing rules."
                : "Try a different search."
            }
            action={
              groups.length === 0 ? (
                <Button type="button" size="sm" onClick={openCreate}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create group
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Stay</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map((g) => (
                  <tr
                    key={g.id}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/frontoffice/group-booking/${g.id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/frontoffice/group-booking/${g.id}`);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-emerald-50/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                          {(g.groupName || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {g.groupName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {g.groupNo ?? "—"}
                            {g.companyName ? ` · ${g.companyName}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{g.arrivalDate}</p>
                      <p className="text-xs text-slate-400">→ {g.departureDate}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {g.groupType || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="truncate">{g.contactName || "—"}</p>
                      {g.contactPhone ? (
                        <p className="text-xs text-slate-400">{g.contactPhone}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                          statusTone(g.status),
                        )}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          router.push(
                            `/frontoffice/group-booking/${g.id}?edit=1`,
                          )
                        }
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={createOpen}
        onClose={closeCreate}
        title="Create group booking"
        description="Add stay dates and room lines. Child reservations are created as TBA until assigned."
        width="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreate}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving}
            >
              {saving ? "Creating…" : "Create group"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {formError ? (
            <AlertBanner
              variant="error"
              message={formError}
              onDismiss={() => setFormError("")}
            />
          ) : null}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Group details
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Group name" required>
                <TextInput
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                />
              </FormField>
              <FormField label="Group type" required>
                <SelectInput
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Tour">Tour</option>
                  <option value="Other">Other</option>
                </SelectInput>
              </FormField>
              <FormField label="Company">
                <TextInput
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </FormField>
              <FormField label="Contact name">
                <TextInput
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </FormField>
              <FormField label="Contact phone">
                <TextInput
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </FormField>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stay dates
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Arrival" required>
                <TextInput
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                />
              </FormField>
              <FormField label="Departure" required>
                <TextInput
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </FormField>
              <FormField label="Nights">
                <TextInput value={nights} readOnly placeholder="—" />
              </FormField>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Room lines
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((prev) => [...prev, { ...EMPTY_LINE }])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add line
              </Button>
            </div>

            {lines.map((line, idx) => {
              const roomsOfType = line.roomType
                ? lines.filter((l) => l.roomType === line.roomType).length
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
                      />
                    </FormField>
                    <FormField label="Adult">
                      <TextInput
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
                              i === idx ? { ...l, tariffPlan: opt.id } : l,
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
                          setLines((prev) => prev.filter((_, i) => i !== idx))
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
                        over ? "font-medium text-red-600" : "text-slate-500",
                      )}
                    >
                      {arrivalDate && departureDate
                        ? `${available}/${roomsByType[line.roomType]?.length ?? 0} available`
                        : "Set dates to check availability"}
                      {line.tariffPlan ? ` · ${formatINR(rate)}/night` : ""}
                      {over ? ` — too many ${line.roomType} lines` : ""}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Billing responsibility
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Who will pay for group expenses? The group owner is the payer
                only — not an automatic guest on every reservation.
              </p>
            </div>

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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                      value={billingRules[key]}
                      onChange={(e) => {
                        const next = e.target.value as BillingResponsibility;
                        if (next !== "GROUP_OWNER" && next !== "GUEST") return;
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
          </section>
        </div>
      </Drawer>
    </div>
  );
}
