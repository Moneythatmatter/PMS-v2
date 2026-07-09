"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { inHouseGuests } from "@/app/data";
import type { InHouseGuest } from "@/app/data/frontoffice/modules";

interface GuestSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (guest: InHouseGuest) => void;
  selectedGuestId?: string | null;
  placeholder?: string;
  className?: string;
}

export function GuestSearchSelect({
  value,
  onChange,
  onSelect,
  selectedGuestId,
  placeholder = "Search guest name or room…",
  className,
}: GuestSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = value.toLowerCase();
    if (!q) return [];
    return inHouseGuests.filter(
      (g) =>
        g.guestName.toLowerCase().includes(q) ||
        g.room.includes(q),
    );
  }, [value]);

  const selectedGuest = selectedGuestId
    ? inHouseGuests.find((g) => g.id === selectedGuestId)
    : null;

  const showDropdown =
    isOpen &&
    matches.length > 0 &&
    value.length > 0 &&
    !(selectedGuest && selectedGuest.guestName === value);

  return (
    <div className={className ?? "relative"}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((g) => (
            <button
              key={g.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(g);
                onChange(g.guestName);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-50"
            >
              <span className="font-medium">{g.guestName}</span>
              <span className="text-xs text-slate-500">Room {g.room}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
