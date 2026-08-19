"use client";

import { useEffect, useMemo, useState } from "react";
import { guestService } from "@/services/front-office";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { guestMatchesQuery, splitGuestName } from "./guestFormUtils";

interface GuestProfileSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelectGuest: (guest: GuestProfile) => void;
  onClear?: () => void;
  selectedGuestId?: string | null;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function GuestProfileSearchSelect({
  value,
  onChange,
  onSelectGuest,
  onClear,
  selectedGuestId,
  placeholder = "Search guest by name, mobile, or email…",
  className,
  inputClassName,
}: GuestProfileSearchSelectProps) {
  const [guests, setGuests] = useState<GuestProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await guestService.list();
        if (!cancelled) setGuests(data);
      } catch {
        if (!cancelled) setGuests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const q = value.trim();
    return guests
      .filter((g) => guestMatchesQuery(g, q))
      .slice(0, 12)
      .map((g) => {
        const { firstName, lastName } = splitGuestName(g.name);
        return {
          id: g.id,
          label: g.name,
          sublabel: [g.mobile, g.email].filter(Boolean).join(" · "),
          hint: g.guestNo,
          data: g,
          firstName,
          lastName,
        };
      });
  }, [guests, value]);

  return (
    <SearchSelect
      options={options}
      value={value}
      onChange={onChange}
      selectedId={selectedGuestId}
      allowCustom
      onSelect={(opt) => {
        const data = opt.data as GuestProfile | { hint?: string } | undefined;
        if (data && "name" in data && typeof data.name === "string") {
          onSelectGuest(data);
          return;
        }
        onChange(opt.label);
        onClear?.();
      }}
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      lockInputWhenSelected={Boolean(selectedGuestId)}
      renderOption={(opt) => {
        const guest = opt.data as GuestProfile;
        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block truncate font-medium text-slate-900">{guest.name}</span>
              <span className="block truncate text-xs text-slate-500">
                {guest.mobile}
                {guest.email ? ` · ${guest.email}` : ""}
              </span>
            </div>
            {guest.guestNo ? (
              <span className="shrink-0 text-xs text-slate-400">{guest.guestNo}</span>
            ) : null}
          </div>
        );
      }}
    />
  );
}
