"use client";

import { useEffect, useMemo, useState } from "react";
import type { InHouseGuest } from "@/app/data/frontoffice/modules";
import { reservationService } from "@/services/front-office";
import { SearchSelect } from "@/components/ui/SearchSelect";

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
  const [guests, setGuests] = useState<InHouseGuest[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reservationService.inHouse();
        if (!cancelled) setGuests(data as InHouseGuest[]);
      } catch {
        if (!cancelled) setGuests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    return guests.map((g) => ({
      id: g.id,
      label: g.guestName,
      sublabel: `Room ${g.room}`,
      data: g,
    }));
  }, [guests]);

  return (
    <SearchSelect
      options={options}
      value={value}
      onChange={onChange}
      selectedId={selectedGuestId}
      onSelect={(opt) => {
        const guest = opt.data as InHouseGuest;
        onSelect(guest);
        onChange(guest.guestName);
      }}
      placeholder={placeholder}
      className={className}
      renderOption={(opt) => {
        const g = opt.data as InHouseGuest;
        return (
          <div className="flex w-full items-center justify-between">
            <span className="font-medium text-slate-900">{g.guestName}</span>
            <span className="text-xs text-slate-500">Room {g.room}</span>
          </div>
        );
      }}
    />
  );
}
