"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BedDouble,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Crown,
  FileText,
  IndianRupee,
  Moon,
  Plus,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { InHouseGuest, RoomStatusCard, RoomTransferRecord } from "@/app/data/frontoffice/modules";
import { reservationService, roomService, transferService } from "@/services/front-office";
import { GuestSearchSelect } from "@/components/frontoffice/GuestSearchSelect";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  EmptyState,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  SummaryRow,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function RoomTransferView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [guestSearch, setGuestSearch] = useState("");
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [guest, setGuest] = useState<InHouseGuest | null>(null);
  const [roomCards, setRoomCards] = useState<RoomStatusCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState("");
  const [transfers, setTransfers] = useState<RoomTransferRecord[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [previewTransfer, setPreviewTransfer] = useState<RoomTransferRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [xfer, inHouse, rooms] = await Promise.all([
          transferService.list(),
          reservationService.inHouse(),
          roomService.status(),
        ]);
        if (!cancelled) {
          setTransfers(xfer);
          const mapped = inHouse as InHouseGuest[];
          setGuests(mapped);
          if (mapped[0]) setGuest(mapped[0]);
          setRoomCards(rooms);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = transfers.filter(
      (t) =>
        (statusFilter === "all" || t.status.toLowerCase() === statusFilter) &&
        (t.guestName.toLowerCase().includes(q) ||
          t.fromRoom.includes(q) ||
          t.toRoom.includes(q) ||
          t.id.toLowerCase().includes(q)),
    );
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guestName.localeCompare(b.guestName));
    if (sortBy === "date") rows = [...rows].sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }, [transfers, search, statusFilter, sortBy]);

  const availableRooms = useMemo(
    () =>
      guest
        ? roomCards.filter(
            (r) =>
              r.status === "Vacant" &&
              r.roomNo !== guest.room &&
              r.type === guest.roomType,
          )
        : [],
    [guest, roomCards],
  );

  const resetForm = () => {
    setGuest(guests[0] ?? null);
    setGuestSearch("");
    setNewRoom("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setReason("");
  };

  const openTransfer = () => {
    resetForm();
    setTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!guest) return;
    if (!newRoom) {
      setToast("Please select a new room.");
      return;
    }
    try {
      const record = await transferService.create({
        guestName: guest.guestName,
        fromRoom: guest.room,
        toRoom: newRoom.split(" ")[0],
        date: new Date(transferDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        reason: reason || "Guest request",
        status: "Completed",
      });
      setTransfers((prev) => [record, ...prev]);
      setTransferOpen(false);
      resetForm();
      setToast(`${guest.guestName} transferred from Room ${guest.room} to ${record.toRoom}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to transfer");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!guest) return <p className="text-sm text-slate-500">No in-house guests.</p>;

  const transferForm = (
    <div className="space-y-4">
      <FormField label="Find Guest" required>
        <GuestSearchSelect
          value={guestSearch}
          onChange={setGuestSearch}
          selectedGuestId={guest.id}
          onSelect={(g) => {
            setGuest(g);
            setGuestSearch(g.guestName);
            setNewRoom("");
          }}
        />
      </FormField>

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Current: Room {guest.room} · {guest.roomType} · Check-out {guest.checkOut}
      </div>

      <FormField label="New Room" required>
        <SelectInput
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        >
          <option value="">Select available room</option>
          {availableRooms.map((r) => (
            <option key={r.roomNo} value={`${r.roomNo} - ${r.type}`}>
              {r.roomNo} — {r.type} ({r.floor})
            </option>
          ))}
        </SelectInput>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Transfer Date">
          <TextInput
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
          />
        </FormField>
        <FormField label="Rate Difference">
          <TextInput value="No change" readOnly className="text-emerald-600" />
        </FormField>
      </div>

      <FormField label="Reason">
        <TextAreaInput
          placeholder="Reason for room transfer…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </FormField>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Room Transfer"
        description="Move a guest to a different room with availability check."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={openTransfer}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Transfer Room
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Available Same Type" value={availableRooms.length} icon={BedDouble} sublabel="Matching room type" />
        <StatMiniCard
          label="Transfers Today"
          value={transfers.filter((t) => t.status === "Completed").length}
          icon={ArrowRightLeft}
        />
        <StatMiniCard label="In-House Guests" value={guests.length} accent="#15803d" icon={Users} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guest, room, or transfer ID…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
          ],
        }}
        hasActiveAdvancedFilters={sortBy !== "newest"}
        onClearAdvancedFilters={() => setSortBy("newest")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Most recent</option>
                <option value="guest">Guest A–Z</option>
                <option value="date">Date</option>
              </SelectInput>
            </FormField>
          </div>
        }
      />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent Transfers</h2>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setPreviewTransfer(r)}
                className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{r.guestName}</p>
                    <p className="text-xs text-slate-500">
                      Room {r.fromRoom} → {r.toRoom}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{r.date}</p>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Transfer ID</th>
                    <th className="pb-3 pr-4">Guest</th>
                    <th className="pb-3 pr-4">From → To</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Reason</th>
                    <th className="pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setPreviewTransfer(r)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs">{r.id}</span>
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-slate-900">
                        {r.guestName}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-medium">
                          {r.fromRoom}{" "}
                          <span className="text-slate-400">→</span> {r.toRoom}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">{r.date}</td>
                      <td className="max-w-[200px] truncate py-3.5 pr-4 text-slate-600">
                        {r.reason}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Transfer form drawer */}
      <Drawer
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Room"
        description="Move guest to an available room of the same type."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleTransfer}>
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
              Confirm Transfer
            </Button>
          </>
        }
      >
        {transferForm}
      </Drawer>

      {/* Preview drawer */}
      <Drawer
        open={!!previewTransfer}
        onClose={() => setPreviewTransfer(null)}
        title={previewTransfer?.guestName ?? ""}
        description={
          previewTransfer
            ? `Room ${previewTransfer.fromRoom} → ${previewTransfer.toRoom}`
            : undefined
        }
        width="md"
        footer={
          previewTransfer && (
            <Button variant="outline" onClick={() => setPreviewTransfer(null)}>
              Close
            </Button>
          )
        }
      >
        {previewTransfer && (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-4 rounded-xl bg-emerald-50 p-5">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-slate-500">From</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {previewTransfer.fromRoom}
                </p>
              </div>
              <ArrowRightLeft className="h-6 w-6 text-emerald-600" />
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-slate-500">To</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {previewTransfer.toRoom}
                </p>
              </div>
            </div>

            <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {previewTransfer.status}
            </span>

            <dl className="grid grid-cols-1 gap-3 text-sm">
              {[
                { icon: User, label: "Guest", value: previewTransfer.guestName },
                { icon: BedDouble, label: "Transfer ID", value: previewTransfer.id },
                { icon: Calendar, label: "Date", value: previewTransfer.date },
                { icon: FileText, label: "Reason", value: previewTransfer.reason },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function parseGuestDate(value: string) {
  return new Date(value);
}

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function dayAfterCheckout(checkOut: string) {
  const next = parseGuestDate(checkOut);
  next.setDate(next.getDate() + 1);
  return toIsoDate(next);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ExtendStayView() {
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState<InHouseGuest | null>(null);
  const [search, setSearch] = useState("");
  const [newCheckout, setNewCheckout] = useState("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await reservationService.inHouse();
        if (!cancelled) {
          setGuests(data as InHouseGuest[]);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nightlyRate = useMemo(() => {
    if (!guest) return 0;
    return guest.nights > 0 ? Math.round(guest.balance / guest.nights) : 4900;
  }, [guest]);

  const extraNights = useMemo(() => {
    if (!guest || !newCheckout) return 0;
    const current = parseGuestDate(guest.checkOut);
    const extended = new Date(newCheckout);
    const diff = Math.ceil(
      (extended.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diff);
  }, [guest, newCheckout]);

  const extraCharges = extraNights * nightlyRate;
  const isAvailable = !!guest && extraNights > 0 && extraNights <= 5;

  const handleSelectGuest = (g: InHouseGuest) => {
    setGuest(g);
    setSearch(g.guestName);
    setNewCheckout(dayAfterCheckout(g.checkOut));
    setApproved(false);
    setReason("");
  };

  const handleClearGuest = () => {
    setGuest(null);
    setSearch("");
    setNewCheckout("");
    setReason("");
    setApproved(false);
  };

  const handleApprove = async () => {
    if (!guest) {
      setToast("Please select a guest first.");
      return;
    }
    if (!isAvailable) {
      setToast("Room not available for the selected dates.");
      return;
    }
    try {
      const formatted = new Date(newCheckout).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      await reservationService.extendStay(guest.id, {
        checkOut: formatted,
        nights: guest.nights + extraNights,
        totalAmount: guest.balance + extraCharges,
        balance: guest.balance + extraCharges,
      });
      setApproved(true);
      setToast(
        `Stay extended for ${guest.guestName} — ${extraNights} extra night(s), ${formatINR(extraCharges)} added.`,
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to extend stay");
    }
  };

  const formattedNewCheckout = newCheckout
    ? new Date(newCheckout).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Extend Stay"
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <Users className="h-4 w-4 text-emerald-600" />
            {guests.length} in-house
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="In-House Guests" value={guests.length} icon={Users} />
        <StatMiniCard label="Extensions Today" value={2} accent="#15803d" icon={CalendarPlus} />
        <StatMiniCard label="Avg. Extra Nights" value="2.5" icon={Moon} sublabel="This week" />
        <StatMiniCard
          label="Extension Revenue"
          value={formatINR(29400)}
          accent="#10b981"
          icon={IndianRupee}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Extension Request</h2>
            </div>

            {approved && guest ? (
              <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50/50 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">Extension Approved</p>
                <p className="mt-1 text-sm text-slate-600">
                  {guest.guestName} · Room {guest.room}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  New checkout {formattedNewCheckout} · +{formatINR(extraCharges)}
                </p>
                <Button
                  className="mt-6 bg-emerald-700 hover:bg-emerald-800"
                  onClick={handleClearGuest}
                >
                  New Request
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <FormField label="Find Guest" required>
                  <GuestSearchSelect
                    value={search}
                    selectedGuestId={guest?.id ?? null}
                    onChange={(value) => {
                      setSearch(value);
                      if (guest && value !== guest.guestName) {
                        setGuest(null);
                        setNewCheckout("");
                      }
                    }}
                    onSelect={handleSelectGuest}
                  />
                </FormField>

                {guest ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                        {getInitials(guest.guestName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">{guest.guestName}</p>
                          {guest.isVip && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="VIP" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Room {guest.room} · {guest.roomType} · Check-out {guest.checkOut}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearGuest}
                        className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        Change
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="New Checkout Date" required>
                        <TextInput
                          type="date"
                          value={newCheckout}
                          min={dayAfterCheckout(guest.checkOut)}
                          onChange={(e) => setNewCheckout(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Extra Nights">
                        <TextInput value={extraNights > 0 ? String(extraNights) : "—"} readOnly />
                      </FormField>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-100 bg-white px-3 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Nightly Rate
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatINR(nightlyRate)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-white px-3 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Extra Charges
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {extraNights > 0 ? formatINR(extraCharges) : "—"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-lg border px-3 py-3",
                          isAvailable
                            ? "border-emerald-100 bg-emerald-50/60"
                            : extraNights > 0
                              ? "border-red-100 bg-red-50/60"
                              : "border-slate-100 bg-white",
                        )}
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Availability
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-sm font-semibold",
                            isAvailable
                              ? "text-emerald-700"
                              : extraNights > 0
                                ? "text-red-600"
                                : "text-slate-400",
                          )}
                        >
                          {!newCheckout
                            ? "Select date"
                            : isAvailable
                              ? "Available"
                              : extraNights === 0
                                ? "Same or earlier date"
                                : "Not available"}
                        </p>
                      </div>
                    </div>

                    <FormField label="Reason (optional)">
                      <TextAreaInput
                        placeholder="Guest request, business travel, etc."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                      />
                    </FormField>

                    <Button
                      className="w-full bg-emerald-700 hover:bg-emerald-800"
                      onClick={handleApprove}
                      disabled={!isAvailable}
                    >
                      Approve Extension
                    </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10">
                    <EmptyState
                      title="Select a guest"
                      description="Search by guest name or room number to begin an extension request."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-900">Extension Summary</h3>
              </div>

              {guest ? (
                <>
                  <div className="mb-4 rounded-lg border border-emerald-100/80 bg-white/80 p-3">
                    <p className="font-semibold text-slate-900">{guest.guestName}</p>
                    <p className="text-xs text-slate-500">
                      Room {guest.room} · {guest.roomType}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <SummaryRow label="Current checkout" value={guest.checkOut} />
                    <SummaryRow
                      label="New checkout"
                      value={formattedNewCheckout}
                      highlight={extraNights > 0}
                    />
                    <SummaryRow
                      label="Extra nights"
                      value={extraNights > 0 ? String(extraNights) : "—"}
                    />
                    <SummaryRow label="Current balance" value={formatINR(guest.balance)} />
                    <SummaryRow
                      label="Extension charges"
                      value={extraNights > 0 ? formatINR(extraCharges) : "—"}
                    />
                  </div>

                  <div className="mt-4 rounded-lg bg-emerald-700 px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-100">New total (est.)</span>
                      <span className="text-lg font-bold">
                        {formatINR(guest.balance + extraCharges)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No guest selected</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Summary will update once you pick a guest.
                  </p>
                </div>
              )}
            </div>

            {guest && extraNights > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                <p className="font-medium text-slate-700">Rate breakdown</p>
                <p className="mt-1.5">
                  {extraNights} night{extraNights !== 1 ? "s" : ""} × {formatINR(nightlyRate)} per
                  night = {formatINR(extraCharges)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export function GroupBookingView() {
  return (
    <div className="space-y-4">
      <FOPageHeader
        eyebrow="Front Office"
        title="Group Booking"
        description="Create and manage group reservations."
      />
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          Group booking module — use New Reservation for individual bookings or contact sales for large groups.
        </p>
      </div>
    </div>
  );
}
