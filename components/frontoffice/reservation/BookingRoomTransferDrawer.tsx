"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoomStatusCard } from "@/app/data/frontoffice/modules";
import type { ReservationBooking } from "@/app/data/types";
import { reservationService, roomService } from "@/services/front-office";
import {
  IncludeDirtyRoomsToggle,
  RoomTypeAvailabilityOption,
  SearchSelect,
} from "@/components/frontoffice/SearchSelect";
import { Button } from "@/components/ui/Button";
import { AlertBanner, Drawer, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import {
  getBlockedRoomNos,
  isRoomDirtyCard,
  isRoomFreeToMoveIn,
} from "@/lib/room-availability";
import { todayIso } from "@/lib/reservation-dates";

const ALL_CATEGORIES = "__all__";

const sameText = (a?: string, b?: string) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

export function BookingRoomTransferDrawer({
  booking,
  onClose,
  onTransferred,
}: {
  booking: ReservationBooking;
  onClose: () => void;
  onTransferred: (toRoom: string) => void;
}) {
  const [roomCards, setRoomCards] = useState<RoomStatusCard[]>([]);
  const [bookings, setBookings] = useState<ReservationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCategory, setRoomCategory] = useState(ALL_CATEGORIES);
  const [includeDirty, setIncludeDirty] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      roomService.status(),
      reservationService.list().catch(() => [] as ReservationBooking[]),
    ])
      .then(([rooms, all]) => {
        if (cancelled) return;
        setRoomCards(rooms);
        setBookings(all);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load rooms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableRooms = useMemo(() => {
    const bookedForStay = getBlockedRoomNos(bookings, todayIso(), booking.checkOut, [], booking.id);
    return roomCards
      .filter(
        (r) =>
          isRoomFreeToMoveIn(r, includeDirty) &&
          !bookedForStay.has(r.roomNo) &&
          r.roomNo !== booking.roomNo,
      )
      .sort((a, b) => {
        const aSame = sameText(a.type, booking.roomType) ? 0 : 1;
        const bSame = sameText(b.type, booking.roomType) ? 0 : 1;
        if (aSame !== bSame) return aSame - bSame;
        return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });
      });
  }, [roomCards, bookings, booking, includeDirty]);

  const categoryOptions = useMemo(() => {
    const names = [...new Set(roomCards.map((r) => r.type?.trim()).filter(Boolean) as string[])].sort(
      (a, b) => a.localeCompare(b),
    );
    return [
      { id: ALL_CATEGORIES, label: "All categories", hint: String(availableRooms.length) },
      ...names.map((name) => ({
        id: name,
        label: name,
        hint: String(availableRooms.filter((r) => sameText(r.type, name)).length),
      })),
    ];
  }, [roomCards, availableRooms]);

  const roomOptions = useMemo(
    () =>
      availableRooms
        .filter((r) => roomCategory === ALL_CATEGORIES || sameText(r.type, roomCategory))
        .map((r) => ({
          id: r.roomNo,
          label: `Room ${r.roomNo}`,
          hint: [
            r.type,
            r.floor,
            isRoomDirtyCard(r) ? "Dirty" : "",
            sameText(r.type, booking.roomType) ? "Same category" : "",
          ]
            .filter(Boolean)
            .join(" · "),
        })),
    [availableRooms, roomCategory, booking.roomType],
  );

  const handleSubmit = async () => {
    if (!newRoom) {
      setError("Select the room to move the guest into.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reservationService.transferRoom(booking.id, {
        toRoom: newRoom,
        reason: reason.trim() || "Guest request",
      });
      onTransferred(newRoom);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to transfer room");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Room Transfer"
      description={`${booking.guestName ?? "Guest"} · currently in Room ${booking.roomNo || "TBA"}${booking.roomType ? ` (${booking.roomType})` : ""}`}
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => void handleSubmit()}
            disabled={submitting || !newRoom}
          >
            {submitting ? "Transferring…" : "Transfer Guest"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
        {loading ? (
          <p className="text-sm text-slate-500">Loading available rooms…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Room Category">
                <SearchSelect
                  options={categoryOptions}
                  selectedId={roomCategory}
                  placeholder="Search room category…"
                  onSelect={(opt) => {
                    setRoomCategory(opt.id);
                    setNewRoom("");
                  }}
                  onClear={() => {
                    setRoomCategory(ALL_CATEGORIES);
                    setNewRoom("");
                  }}
                  renderOption={(opt) => (
                    <RoomTypeAvailabilityOption label={opt.label} count={Number(opt.hint ?? 0)} />
                  )}
                />
                <IncludeDirtyRoomsToggle
                  checked={includeDirty}
                  onChange={(checked) => {
                    setIncludeDirty(checked);
                    setNewRoom("");
                  }}
                />
              </FormField>
              <FormField label="New Room" required>
                <SearchSelect
                  options={roomOptions}
                  selectedId={newRoom || null}
                  disabled={roomOptions.length === 0}
                  placeholder={
                    roomOptions.length === 0
                      ? "No available rooms"
                      : `Search ${roomOptions.length} available room${roomOptions.length === 1 ? "" : "s"}…`
                  }
                  onSelect={(opt) => setNewRoom(opt.id)}
                  onClear={() => setNewRoom("")}
                />
              </FormField>
            </div>
            <FormField label="Reason">
              <TextAreaInput
                rows={2}
                value={reason}
                placeholder="Guest request, maintenance issue…"
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>
            <p className="text-xs text-slate-500">
              The rate and stay dates stay the same. Room {booking.roomNo || "—"} will be sent to housekeeping as dirty.
            </p>
          </>
        )}
      </div>
    </Drawer>
  );
}
