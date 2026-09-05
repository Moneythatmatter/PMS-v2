"use client";

import { useMemo } from "react";
import { SearchSelect } from "@/components/ui/SearchSelect";
import {
  buildBookingSearchOptions,
  type BookingLookupRecord,
} from "@/lib/booking-lookup";
import { cn } from "@/lib/utils";

const lookupInputClass =
  "h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100";

interface BookingLookupSearchProps {
  items: BookingLookupRecord[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedId?: string | null;
  onSelectItem: (item: BookingLookupRecord) => void;
  onClear?: () => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}

export function BookingLookupSearch({
  items,
  query,
  onQueryChange,
  selectedId,
  onSelectItem,
  onClear,
  onEnter,
  placeholder = "Name, booking ID, phone, or email",
  className,
}: BookingLookupSearchProps) {
  const options = useMemo(() => buildBookingSearchOptions(items), [items]);

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter?.();
        }
      }}
    >
      <SearchSelect
      options={options}
      value={query}
      onChange={onQueryChange}
      requireQuery
      selectedId={selectedId}
      onSelect={(opt) => {
        const item = opt.data as BookingLookupRecord;
        onSelectItem(item);
        onQueryChange(item.bookingNo);
      }}
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={cn(lookupInputClass)}
      renderOption={(opt) => {
        const item = opt.data as BookingLookupRecord;
        return (
          <div className="flex min-w-0 w-full flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-slate-900">
                {item.guestName || item.bookingNo}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {item.bookingNo}
              </span>
            </div>
            {(item.phone || item.email || item.room) && (
              <span className="truncate text-xs text-slate-500">
                {[item.room && `Room ${item.room}`, item.phone, item.email]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
        );
      }}
    />
    </div>
  );
}
