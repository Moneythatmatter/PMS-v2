"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, Plus, User, XCircle } from "lucide-react";
import { hkGuestRequestService } from "@/services/housekeeping";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatGuestRequestTypeLabel, type GuestRequestDto } from "./guestRequestUtils";
import { DetailItem, formatShortDateTime, priorityBadgeClass } from "./detailParts";

export type CleaningRequestDetailPanelProps = {
  request: GuestRequestDto;
  onCreateTask: (request: GuestRequestDto) => void;
  onClosed?: () => void | Promise<void>;
};

export function CleaningRequestDetailPanel({
  request,
  onCreateTask,
  onClosed,
}: CleaningRequestDetailPanelProps) {
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeRequest = async () => {
    setBusy(true);
    setError(null);
    try {
      const reason = closeReason.trim();
      const notes = reason
        ? [request.notes, `Closed: ${reason}`].filter(Boolean).join("\n")
        : undefined;
      await hkGuestRequestService.cancel(request.id, notes ? { notes } : undefined);
      setCloseOpen(false);
      setCloseReason("");
      await onClosed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not close request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {request.requestNumber ?? request.id.slice(0, 8)}
            </p>
            <p className="text-lg font-bold leading-tight text-slate-900">
              Room {request.roomNo ?? request.roomId}
            </p>
            <p className="text-xs text-slate-500">{formatGuestRequestTypeLabel(request.requestType)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
              {request.status.replace(/_/g, " ")}
            </span>
            {request.priority ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                  priorityBadgeClass(request.priority),
                )}
              >
                {request.priority}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-xs">
          <DetailItem icon={User} label="Guest" truncate>
            {request.guestName ?? "—"}
          </DetailItem>
          <DetailItem icon={BookOpen} label="Booking" truncate>
            {request.bookingNo ?? "—"}
          </DetailItem>
          <DetailItem icon={CalendarDays} label="Requested" truncate>
            {formatShortDateTime(request.requestedAt ?? request.createdAt)}
          </DetailItem>
          <DetailItem icon={User} label="Raised by" truncate>
            {request.createdBy ?? "—"}
          </DetailItem>
        </dl>

        {request.description && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Request: </span>
            {request.description}
          </div>
        )}
        {request.notes && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600 whitespace-pre-line">
            <span className="font-semibold text-slate-700">Notes: </span>
            {request.notes}
          </div>
        )}
      </div>

      <Button
        className="w-full bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-2"
        disabled={busy}
        onClick={() => onCreateTask(request)}
      >
        <Plus className="h-4 w-4" /> Create Cleaning Task
      </Button>

      {closeOpen ? (
        <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/40 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Close this request?</h4>
            <p className="text-[11px] text-slate-500">
              The guest request is cancelled and removed from the cleaning board.
            </p>
          </div>
          <textarea
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            rows={2}
            placeholder="Reason (optional) — e.g. guest no longer needs cleaning"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => {
                setCloseOpen(false);
                setCloseReason("");
              }}
            >
              Keep Request
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              disabled={busy}
              onClick={() => void closeRequest()}
            >
              {busy ? "Closing…" : "Close Request"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
          disabled={busy}
          onClick={() => setCloseOpen(true)}
        >
          <XCircle className="h-4 w-4" /> Close Request
        </Button>
      )}
    </div>
  );
}
