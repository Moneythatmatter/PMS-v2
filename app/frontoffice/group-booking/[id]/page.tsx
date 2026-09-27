"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarRange,
  ExternalLink,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  AlertBanner,
  EmptyState,
  FOPageHeader,
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { ReservationStatusBadge } from "@/components/frontoffice/reservation/ReservationStatusBadge";
import {
  groupService,
  type FoGroupBillingRuleDto,
  type FoGroupDto,
  type GroupFolioDto,
} from "@/services/front-office/groups";
import {
  reservationService,
  roomService,
} from "@/services/front-office";
import type { ReservationBooking } from "@/app/data/types/frontoffice";
import type { RoomAvailabilityBlock } from "@/services/front-office/rooms";
import { ApiError } from "@/services/api";
import {
  allBookingsDetailHref,
  checkInHref,
  checkOutHref,
  guestFolioHref,
} from "@/lib/check-in-navigation";
import {
  filterRoomsForStay,
  isRoomSellableStatus,
} from "@/lib/room-availability";
import { normalizeToIso } from "@/lib/reservation-dates";
import { cn } from "@/lib/utils";

type ChildReservation = {
  id: string;
  bookingNo?: string;
  guestName?: string;
  guestId?: string | null;
  roomNo?: string | null;
  roomRefId?: string | null;
  roomType?: string;
  status?: string;
  totalAmount?: number;
  bookingType?: string;
  checkIn?: string;
  checkOut?: string;
};

const CATEGORY_LABELS: Array<{ key: string; label: string }> = [
  { key: "ROOM", label: "Room Charges" },
  { key: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { key: "MINIBAR", label: "Minibar" },
  { key: "LAUNDRY", label: "Laundry" },
  { key: "OTHER", label: "Other" },
];

function hasAssignedRoom(roomNo?: string | null) {
  const value = String(roomNo ?? "").trim();
  if (!value) return false;
  return !/^(tba|n\/?a|unassigned|-)$/i.test(value);
}

function displayRoomNo(roomNo?: string | null) {
  return hasAssignedRoom(roomNo) ? String(roomNo).trim() : "TBA";
}

function canCheckIn(status?: string) {
  const s = String(status ?? "").trim();
  return (
    s !== "Checked In" &&
    s !== "In-House" &&
    s !== "Checked Out" &&
    s !== "Cancelled" &&
    s !== "No Show"
  );
}

function canCheckOut(status?: string) {
  const s = String(status ?? "").trim();
  return s === "Checked In" || s === "In-House";
}

function nightsBetween(arrival?: string, departure?: string): number {
  if (!arrival || !departure) return 0;
  const a = Date.parse(arrival);
  const b = Date.parse(departure);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function normalizeChildReservation(raw: Record<string, unknown>): ChildReservation {
  const roomNo = String(
    raw.roomNo ?? raw.room_no ?? raw.room ?? "",
  ).trim();
  return {
    id: String(raw.id ?? ""),
    bookingNo: (raw.bookingNo ?? raw.booking_no) as string | undefined,
    guestName: (raw.guestName ?? raw.guest_name) as string | undefined,
    guestId: (raw.guestId ?? raw.guest_id) as string | null | undefined,
    roomNo: roomNo || null,
    roomRefId: (raw.roomRefId ?? raw.room_ref_id) as string | null | undefined,
    roomType: (raw.roomType ??
      raw.room_type ??
      raw.requestedRoomType ??
      raw.requested_room_type) as string | undefined,
    status: raw.status as string | undefined,
    totalAmount: Number(raw.totalAmount ?? raw.total_amount ?? 0),
    bookingType: (raw.bookingType ?? raw.booking_type) as string | undefined,
    checkIn: (raw.checkIn ?? raw.check_in) as string | undefined,
    checkOut: (raw.checkOut ?? raw.check_out) as string | undefined,
  };
}

export default function GroupBookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params?.id ?? "");
  const openEditOnLoad = searchParams.get("edit") === "1";

  const [group, setGroup] = useState<FoGroupDto | null>(null);
  const [children, setChildren] = useState<ChildReservation[]>([]);
  const [rules, setRules] = useState<FoGroupBillingRuleDto[]>([]);
  const [folio, setFolio] = useState<GroupFolioDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    groupName: "",
    groupType: "",
    companyName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    arrivalDate: "",
    departureDate: "",
    notes: "",
  });

  const [assignTarget, setAssignTarget] = useState<ChildReservation | null>(
    null,
  );
  const [assignRoomNo, setAssignRoomNo] = useState("");
  const [assignRoomQuery, setAssignRoomQuery] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignLoadingRooms, setAssignLoadingRooms] = useState(false);
  const [availableRoomOptions, setAvailableRoomOptions] = useState<
    Array<{ id: string; label: string; hint?: string; roomId?: string }>
  >([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [g, res, billing, master] = await Promise.all([
        groupService.get(id),
        groupService.reservations(id),
        groupService.billingRules(id),
        groupService.folio(id).catch(() => null),
      ]);
      setGroup(g);
      setChildren(
        (res as Record<string, unknown>[]).map(normalizeChildReservation),
      );
      setRules(billing);
      setFolio(master);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = useCallback((g: FoGroupDto) => {
    setEditForm({
      groupName: g.groupName ?? "",
      groupType: g.groupType ?? "",
      companyName: g.companyName ?? "",
      contactName: g.contactName ?? "",
      contactPhone: g.contactPhone ?? "",
      contactEmail: g.contactEmail ?? "",
      arrivalDate: normalizeToIso(g.arrivalDate) || g.arrivalDate || "",
      departureDate: normalizeToIso(g.departureDate) || g.departureDate || "",
      notes: g.notes ?? "",
    });
    setEditError("");
    setEditOpen(true);
  }, []);

  useEffect(() => {
    if (!openEditOnLoad || !group || editOpen) return;
    openEdit(group);
  }, [openEditOnLoad, group, editOpen, openEdit]);

  const handleSaveEdit = async () => {
    if (!id) return;
    const name = editForm.groupName.trim();
    if (!name) {
      setEditError("Group name is required.");
      return;
    }
    if (!editForm.arrivalDate || !editForm.departureDate) {
      setEditError("Arrival and departure dates are required.");
      return;
    }
    if (editForm.departureDate <= editForm.arrivalDate) {
      setEditError("Departure must be after arrival.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const updated = await groupService.update(id, {
        groupName: name,
        groupType: editForm.groupType.trim() || null,
        companyName: editForm.companyName.trim() || null,
        contactName: editForm.contactName.trim() || null,
        contactPhone: editForm.contactPhone.trim() || null,
        contactEmail: editForm.contactEmail.trim() || null,
        arrivalDate: editForm.arrivalDate,
        departureDate: editForm.departureDate,
        notes: editForm.notes.trim() || null,
      });
      setGroup(updated);
      setEditOpen(false);
      setToastVariant("success");
      setToast("Group booking updated.");
      await load();
    } catch (e) {
      setEditError(
        e instanceof ApiError ? e.message : "Failed to update group",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const openAssignRoom = useCallback(
    async (reservation: ChildReservation) => {
      setAssignTarget(reservation);
      setAssignRoomNo("");
      setAssignRoomQuery("");
      setAvailableRoomOptions([]);
      setAssignLoadingRooms(true);
      try {
        const checkIn =
          normalizeToIso(reservation.checkIn ?? group?.arrivalDate ?? "") ||
          "";
        const checkOut =
          normalizeToIso(reservation.checkOut ?? group?.departureDate ?? "") ||
          "";

        const [roomCards, reservationList, blocks] = await Promise.all([
          roomService.status().catch(() => []),
          reservationService.list().catch(() => [] as ReservationBooking[]),
          checkIn && checkOut
            ? roomService.blocks(checkIn, checkOut).catch(() => [])
            : Promise.resolve([] as RoomAvailabilityBlock[]),
        ]);

        const roomType = String(reservation.roomType ?? "").trim();
        const pool = roomCards
          .filter((r) => isRoomSellableStatus(r.status))
          .filter((r) => !roomType || r.type === roomType)
          .map((r) => ({
            roomNo: r.roomNo,
            roomId: r.id,
            type: r.type,
          }));

        const availableNos =
          checkIn && checkOut
            ? filterRoomsForStay(
                pool.map((p) => p.roomNo),
                reservationList,
                checkIn,
                checkOut,
                blocks,
                reservation.id,
              )
            : pool.map((p) => p.roomNo);

        const availableSet = new Set(availableNos);
        setAvailableRoomOptions(
          pool
            .filter((p) => availableSet.has(p.roomNo))
            .sort((a, b) =>
              a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }),
            )
            .map((p) => ({
              id: p.roomNo,
              label: `Room ${p.roomNo}`,
              hint: p.type || roomType || undefined,
              roomId: p.roomId,
            })),
        );
      } catch {
        setAvailableRoomOptions([]);
      } finally {
        setAssignLoadingRooms(false);
      }
    },
    [group?.arrivalDate, group?.departureDate],
  );

  async function confirmAssignRoom() {
    if (!assignTarget || !assignRoomNo.trim()) return;
    setAssignSaving(true);
    try {
      const selected = availableRoomOptions.find(
        (o) => o.id === assignRoomNo,
      );
      await reservationService.update(assignTarget.id, {
        roomRefId: selected?.roomId || assignRoomNo,
        roomNo: assignRoomNo,
      });
      setToastVariant("success");
      setToast(`Room ${assignRoomNo} assigned to ${assignTarget.bookingNo ?? "booking"}.`);
      setAssignTarget(null);
      setAssignRoomNo("");
      setAssignRoomQuery("");
      await load();
    } catch (e) {
      setToastVariant("error");
      setToast(
        e instanceof ApiError ? e.message : "Failed to assign room",
      );
    } finally {
      setAssignSaving(false);
    }
  }

  const filteredAssignRooms = useMemo(() => {
    const q = assignRoomQuery.trim().toLowerCase();
    if (!q) return availableRoomOptions;
    const selected = availableRoomOptions.find((o) => o.id === assignRoomNo);
    // Keep full list visible when search shows the selected room label
    if (selected && q === selected.label.toLowerCase()) {
      return availableRoomOptions;
    }
    return availableRoomOptions.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        String(o.hint ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [availableRoomOptions, assignRoomQuery, assignRoomNo]);

  const checkInEligible = useMemo(
    () =>
      children.filter(
        (r) => canCheckIn(r.status) && hasAssignedRoom(r.roomNo),
      ),
    [children],
  );
  const needsRoomAssign = useMemo(
    () =>
      children.filter(
        (r) => canCheckIn(r.status) && !hasAssignedRoom(r.roomNo),
      ),
    [children],
  );
  const primaryCheckIn = checkInEligible[0] ?? null;
  const primaryAssign = needsRoomAssign[0] ?? null;
  const nights = nightsBetween(group?.arrivalDate, group?.departureDate);

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title={group?.groupName ?? "Group detail"}
        description={
          group
            ? "Child stays, shared billing, and master folio"
            : "Child reservations, billing rules, and master folio"
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/frontoffice/group-booking"
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw
                className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")}
              />
              Refresh
            </Button>
            {group ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openEdit(group)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}
            {primaryCheckIn ? (
              <Link href={checkInHref({ id: primaryCheckIn.id })}>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Check In
                  {checkInEligible.length > 1
                    ? ` (${checkInEligible.length})`
                    : ""}
                </Button>
              </Link>
            ) : primaryAssign ? (
              <Button
                size="sm"
                className="gap-1.5 bg-slate-900 hover:bg-slate-800"
                onClick={() => void openAssignRoom(primaryAssign)}
              >
                <BedDouble className="h-3.5 w-3.5" />
                Assign Room
                {needsRoomAssign.length > 1
                  ? ` (${needsRoomAssign.length})`
                  : ""}
              </Button>
            ) : null}
          </div>
        }
      />

      {toast ? (
        <AlertBanner
          variant={toastVariant}
          message={toast}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      {error ? (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {loading && !group ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          {/* Group meta + stats */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {group?.groupNo ? (
                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold tracking-wide text-white">
                      {group.groupNo}
                    </span>
                  ) : null}
                  {group?.status ? (
                    <ReservationStatusBadge status={group.status} />
                  ) : null}
                  {group?.groupType ? (
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                      {group.groupType}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                    {group?.arrivalDate ?? "—"} → {group?.departureDate ?? "—"}
                    {nights > 0 ? (
                      <span className="text-slate-400">
                        · {nights} night{nights === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                  {group?.companyName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {group.companyName}
                    </span>
                  ) : null}
                  {group?.contactName || group?.contactPhone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {[group.contactName, group.contactPhone]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                </div>
              </div>
              {folio ? (
                <Link
                  href={guestFolioHref({ id: folio.id })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {folio.folioNumber ?? "Master folio"}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Child reservations
                  </p>
                  <p className="text-xs text-slate-500">
                    {children.length} stay{children.length === 1 ? "" : "s"} in
                    this group
                  </p>
                </div>
                {primaryCheckIn ? (
                  <Link href={checkInHref({ id: primaryCheckIn.id })}>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Check In next
                    </Button>
                  </Link>
                ) : primaryAssign ? (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-slate-900 hover:bg-slate-800"
                    onClick={() => void openAssignRoom(primaryAssign)}
                  >
                    <BedDouble className="h-3.5 w-3.5" />
                    Assign next room
                  </Button>
                ) : null}
              </div>

              {children.length === 0 ? (
                <EmptyState
                  title="No child reservations"
                  description="This group has no linked stays."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="pb-2.5 pr-3 font-medium">Booking</th>
                        <th className="pb-2.5 pr-3 font-medium">Guest</th>
                        <th className="pb-2.5 pr-3 font-medium">Room / type</th>
                        <th className="pb-2.5 pr-3 font-medium">Status</th>
                        <th className="pb-2.5 pr-3 font-medium text-right">
                          Amount
                        </th>
                        <th className="pb-2.5 font-medium text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {children.map((r) => {
                        const roomAssigned = hasAssignedRoom(r.roomNo);
                        const checkInOk =
                          canCheckIn(r.status) && roomAssigned;
                        const checkInNeedsRoom =
                          canCheckIn(r.status) && !roomAssigned;
                        const checkOutOk = canCheckOut(r.status);
                        return (
                          <tr
                            key={r.id}
                            className="align-middle hover:bg-slate-50/70"
                          >
                            <td className="py-3 pr-3">
                              <Link
                                href={allBookingsDetailHref({ id: r.id })}
                                className="font-semibold text-teal-700 hover:underline"
                              >
                                {r.bookingNo ?? r.id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="py-3 pr-3 text-slate-600">
                              {r.guestName ||
                                (!r.guestId ? (
                                  <span className="italic text-slate-400">
                                    Unassigned
                                  </span>
                                ) : (
                                  "—"
                                ))}
                            </td>
                            <td className="py-3 pr-3 text-slate-600">
                              <span
                                className={cn(
                                  "font-medium",
                                  roomAssigned
                                    ? "text-slate-800"
                                    : "text-amber-700",
                                )}
                              >
                                {roomAssigned
                                  ? `Room ${displayRoomNo(r.roomNo)}`
                                  : "TBA"}
                              </span>
                              {r.roomType ? (
                                <span className="text-slate-400">
                                  {" "}
                                  · {r.roomType}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 pr-3">
                              <ReservationStatusBadge
                                status={r.status ?? "—"}
                              />
                            </td>
                            <td className="py-3 pr-3 text-right font-medium text-slate-800">
                              {formatINR(Number(r.totalAmount ?? 0))}
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                <Link
                                  href={`/frontoffice/reservation/new?bookingId=${encodeURIComponent(r.id)}`}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 px-2.5 text-xs"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </Button>
                                </Link>
                                {checkInOk ? (
                                  <Link href={checkInHref({ id: r.id })}>
                                    <Button
                                      size="sm"
                                      className="h-8 gap-1 bg-emerald-700 px-2.5 text-xs hover:bg-emerald-800"
                                    >
                                      <LogIn className="h-3 w-3" />
                                      Check In
                                    </Button>
                                  </Link>
                                ) : null}
                                {checkInNeedsRoom ? (
                                  <Button
                                    size="sm"
                                    className="h-8 gap-1 bg-slate-900 px-2.5 text-xs hover:bg-slate-800"
                                    onClick={() => void openAssignRoom(r)}
                                  >
                                    <BedDouble className="h-3 w-3" />
                                    Assign Room
                                  </Button>
                                ) : null}
                                {checkOutOk ? (
                                  <Link href={checkOutHref({ id: r.id })}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-1 border-emerald-200 px-2.5 text-xs text-emerald-800 hover:bg-emerald-50"
                                    >
                                      <LogOut className="h-3 w-3" />
                                      Check Out
                                    </Button>
                                  </Link>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Master folio
                  </p>
                  {folio ? (
                    <Link
                      href={guestFolioHref({ id: folio.id })}
                      className="text-xs font-medium text-teal-700 hover:underline"
                    >
                      Open folio
                    </Link>
                  ) : null}
                </div>
                {folio ? (
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Folio</dt>
                      <dd className="font-semibold text-slate-800">
                        <Link
                          href={guestFolioHref({ id: folio.id })}
                          className="text-teal-700 underline-offset-2 hover:underline"
                        >
                          {folio.folioNumber ?? folio.id.slice(0, 8)}
                        </Link>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Status</dt>
                      <dd>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            folio.status === "OPEN"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {folio.status}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Subtotal</dt>
                      <dd className="font-medium text-slate-800">
                        {formatINR(Number(folio.subtotal ?? 0))}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Paid</dt>
                      <dd className="font-medium text-slate-800">
                        {formatINR(Number(folio.paidAmount ?? 0))}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2.5">
                      <dt className="font-medium text-slate-700">Balance</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatINR(Number(folio.balanceAmount ?? 0))}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">
                    No master folio (all charges may be guest-paid).
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="mb-1 text-sm font-semibold text-slate-800">
                  Billing responsibility
                </p>
                <p className="mb-3 text-xs text-slate-500">
                  Who pays for each charge category
                </p>
                <ul className="divide-y divide-slate-100">
                  {CATEGORY_LABELS.map(({ key, label }) => {
                    const rule = rules.find(
                      (r) =>
                        String(r.chargeCategory).toUpperCase() === key,
                    );
                    const responsibility = String(
                      rule?.responsibility ?? "",
                    ).toUpperCase();
                    const isOwner = responsibility === "GROUP_OWNER";
                    const isGuest = responsibility === "GUEST";
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <span className="text-slate-600">{label}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            isOwner
                              ? "bg-indigo-50 text-indigo-700"
                              : isGuest
                                ? "bg-slate-100 text-slate-700"
                                : "bg-slate-50 text-slate-500",
                          )}
                        >
                          {isOwner
                            ? "Group Owner"
                            : isGuest
                              ? "Guest"
                              : rule?.responsibility || "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal
        open={Boolean(assignTarget)}
        onClose={() => {
          if (assignSaving) return;
          setAssignTarget(null);
          setAssignRoomNo("");
          setAssignRoomQuery("");
        }}
        title="Assign room"
        size="lg"
        className="min-h-[560px] h-[min(70vh,640px)]"
        description={
          assignTarget
            ? `${assignTarget.bookingNo ?? "Booking"} · ${assignTarget.roomType || "Room"} · ${assignTarget.guestName || "Guest TBA"}`
            : undefined
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={assignSaving}
              onClick={() => {
                setAssignTarget(null);
                setAssignRoomNo("");
                setAssignRoomQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={
                assignSaving ||
                assignLoadingRooms ||
                !assignRoomNo.trim()
              }
              onClick={() => void confirmAssignRoom()}
            >
              {assignSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Assign room"
              )}
            </Button>
          </>
        }
      >
        {assignLoadingRooms ? (
          <p className="flex min-h-[280px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading available rooms…
          </p>
        ) : availableRoomOptions.length === 0 ? (
          <p className="flex min-h-[280px] items-center justify-center text-sm text-amber-700">
            No available rooms
            {assignTarget?.roomType
              ? ` for ${assignTarget.roomType}`
              : ""}{" "}
            on these dates.
          </p>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col gap-3">
            <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
              Available rooms ({filteredAssignRooms.length}
              {assignRoomQuery.trim()
                ? ` of ${availableRoomOptions.length}`
                : ""}
              )
            </p>
            <TextInput
              className="rounded-xl"
              value={assignRoomQuery}
              placeholder="Search room number…"
              onChange={(e) => setAssignRoomQuery(e.target.value)}
            />
            {filteredAssignRooms.length === 0 ? (
              <p className="text-sm text-slate-500">
                No rooms match “{assignRoomQuery.trim()}”.
              </p>
            ) : (
              <ul className="max-h-none min-h-[280px] flex-1 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {filteredAssignRooms.map((opt) => {
                  const selected = assignRoomNo === opt.id;
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignRoomNo(opt.id);
                          setAssignRoomQuery(opt.label);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition",
                          selected
                            ? "bg-emerald-50 font-semibold text-emerald-900"
                            : "text-slate-800 hover:bg-slate-50",
                        )}
                      >
                        <span>{opt.label}</span>
                        {opt.hint ? (
                          <span className="text-xs text-slate-500">
                            {opt.hint}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => {
          if (!editSaving) setEditOpen(false);
        }}
        title="Edit group booking"
        description="Update group details and stay dates. Dates sync to rooms that are not yet checked in."
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={editSaving}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={editSaving}
              onClick={() => void handleSaveEdit()}
            >
              {editSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editError ? (
            <AlertBanner
              variant="error"
              message={editError}
              onDismiss={() => setEditError("")}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Group name" required>
              <TextInput
                value={editForm.groupName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, groupName: e.target.value }))
                }
                placeholder="Group name"
              />
            </FormField>
            <FormField label="Group type">
              <SelectInput
                value={editForm.groupType}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, groupType: e.target.value }))
                }
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
                value={editForm.companyName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, companyName: e.target.value }))
                }
                placeholder="Company name"
              />
            </FormField>
            <FormField label="Contact name">
              <TextInput
                value={editForm.contactName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, contactName: e.target.value }))
                }
                placeholder="Group owner / contact"
              />
            </FormField>
            <FormField label="Contact phone">
              <TextInput
                value={editForm.contactPhone}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    contactPhone: e.target.value.replace(/\D/g, "").slice(0, 15),
                  }))
                }
                placeholder="Phone"
              />
            </FormField>
            <FormField label="Contact email">
              <TextInput
                type="email"
                value={editForm.contactEmail}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, contactEmail: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </FormField>
            <FormField label="Arrival" required>
              <TextInput
                type="date"
                value={editForm.arrivalDate}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, arrivalDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Departure" required>
              <TextInput
                type="date"
                value={editForm.departureDate}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, departureDate: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <TextAreaInput
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Special requests, billing notes…"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
