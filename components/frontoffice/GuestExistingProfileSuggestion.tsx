"use client";

import type { GuestProfile } from "@/app/data/frontoffice/modules";
import { UserRound } from "lucide-react";

type GuestExistingProfileSuggestionProps = {
  guest: GuestProfile;
  onSelect: (guest: GuestProfile) => void;
  fieldLabel?: string;
};

export function GuestExistingProfileSuggestion({
  guest,
  onSelect,
  fieldLabel = "contact",
}: GuestExistingProfileSuggestionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(guest)}
      className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
          <UserRound className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Existing guest · {fieldLabel} match
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{guest.name}</p>
          <p className="truncate text-xs text-slate-600">
            {guest.mobile}
            {guest.email ? ` · ${guest.email}` : ""}
            {guest.guestNo ? ` · ${guest.guestNo}` : ""}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">Use this profile →</p>
        </div>
      </div>
    </button>
  );
}
