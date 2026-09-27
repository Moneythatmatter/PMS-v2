"use client";

import { useMemo, type ReactNode } from "react";
import { SearchSelect as BaseSearchSelect, type SearchOption } from "@/components/ui/SearchSelect";

export interface SearchSelectOption {
  id: string;
  label: string;
  hint?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  selectedId?: string | null;
  onSelect: (option: SearchSelectOption) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Allow committing typed text that is not in the options list. */
  allowCustom?: boolean;
  /** When a selection exists, lock the input (clear via X only). */
  lockInputWhenSelected?: boolean;
  disabled?: boolean;
  renderOption?: (option: SearchSelectOption) => ReactNode;
}

export function SearchSelect({
  options,
  selectedId,
  onSelect,
  onClear,
  placeholder = "Search…",
  className,
  inputClassName,
  allowCustom = false,
  lockInputWhenSelected = false,
  disabled = false,
  renderOption,
}: SearchSelectProps) {
  const searchOptions: SearchOption[] = useMemo(
    () =>
      options.map((o) => ({
        id: o.id,
        label: o.label,
        hint: o.hint,
        data: o,
      })),
    [options]
  );

  return (
    <BaseSearchSelect
      options={searchOptions}
      selectedId={selectedId}
      onSelect={(opt) =>
        onSelect((opt.data as SearchSelectOption) ?? { id: opt.id, label: opt.label, hint: opt.hint })
      }
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      allowCustom={allowCustom}
      lockInputWhenSelected={lockInputWhenSelected}
      disabled={disabled}
      renderOption={
        renderOption
          ? (opt) =>
              renderOption(
                (opt.data as SearchSelectOption) ?? {
                  id: opt.id,
                  label: opt.label,
                  hint: opt.hint,
                },
              )
          : undefined
      }
    />
  );
}

/** Room type row: name + red availability count badge. */
export function RoomTypeAvailabilityOption({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="truncate font-medium text-slate-900">{label}</span>
      <span
        className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded bg-red-500 px-1.5 text-[11px] font-semibold leading-none text-white"
        aria-label={`${count} available`}
      >
        {count}
      </span>
    </div>
  );
}
