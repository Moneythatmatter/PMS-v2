"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function SearchSelect({
  options,
  selectedId,
  onSelect,
  onClear,
  placeholder = "Search…",
  className,
  inputClassName,
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = selectedId ? options.find((o) => o.id === selectedId) : null;
  const displayValue = isOpen ? query : selected?.label ?? query;

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [query, options]);

  const showDropdown = isOpen && matches.length > 0;
  const showClear = Boolean(selectedId || displayValue.trim());

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    onClear?.();
  };

  return (
    <div className={className ?? "relative"}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setQuery(selected?.label ?? "");
          setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100",
          showClear ? "pr-9" : "pr-3",
          inputClassName,
        )}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Clear selection"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showDropdown && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(option);
                setQuery("");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-emerald-50",
                selectedId === option.id && "bg-emerald-50/60",
              )}
            >
              <span className="min-w-0 truncate font-medium text-slate-900">{option.label}</span>
              {option.hint && (
                <span className="shrink-0 text-xs text-slate-500">{option.hint}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
