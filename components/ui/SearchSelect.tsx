"use client";

import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchOption {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
  data?: unknown;
}

export interface SearchSelectProps {
  options?: SearchOption[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: SearchOption) => void;
  onClear?: () => void;
  selectedId?: string | null;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  renderOption?: (option: SearchOption) => ReactNode;
  /** Allow committing typed text that is not in the options list. */
  allowCustom?: boolean;
  /** When a selection exists, lock the input (clear via X only). */
  lockInputWhenSelected?: boolean;
}

export function SearchSelect({
  options = [],
  value = "",
  onChange,
  onSelect,
  onClear,
  selectedId,
  placeholder = "Search…",
  label,
  className,
  inputClassName,
  renderOption,
  allowCustom = false,
  lockInputWhenSelected = false,
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((opt) => {
      if (seen.has(opt.id)) return false;
      seen.add(opt.id);
      return true;
    });
  }, [options]);

  const isControlledQuery = onChange !== undefined;
  const query = isControlledQuery ? value : internalQuery;

  const selected =
    (selectedId ? uniqueOptions.find((o) => o.id === selectedId) : null) ??
    (selectedId
      ? { id: selectedId, label: selectedId, data: { id: selectedId, label: selectedId } }
      : null);

  const displayValue = isOpen ? query : (selected?.label ?? "");

  const matches = uniqueOptions.filter((opt) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.id.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.hint && opt.hint.toLowerCase().includes(q))
    );
  });

  const trimmedQuery = query.trim();
  const exactMatch = uniqueOptions.some(
    (o) =>
      o.id.toLowerCase() === trimmedQuery.toLowerCase() ||
      o.label.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const canCommitCustom = allowCustom && trimmedQuery.length > 0 && !exactMatch;

  const commitCustom = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const custom: SearchOption = {
      id: text,
      label: text,
      hint: "Custom",
      data: { id: text, label: text, hint: "Custom" },
    };
    onSelect?.(custom);
    if (!isControlledQuery) setInternalQuery("");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (allowCustom && !isControlledQuery && internalQuery.trim()) {
          commitCustom(internalQuery);
          return;
        }
        // Typed text that never matched an option is not a selection — don't leave it
        // in the box looking like one.
        if (!isControlledQuery) setInternalQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commit uses latest query via refs would be overkill; query captured on each open cycle
  }, [allowCustom, isControlledQuery, internalQuery]);

  const showDropdown = isOpen && !(lockInputWhenSelected && selectedId);
  const inputLocked = lockInputWhenSelected && Boolean(selectedId);

  const handleInputChange = (val: string) => {
    if (inputLocked) return;
    if (isControlledQuery) {
      onChange?.(val);
    } else {
      setInternalQuery(val);
    }
    setIsOpen(true);
  };

  const showClear = Boolean(selectedId || displayValue.trim());

  const handleClear = () => {
    if (isControlledQuery) {
      onChange?.("");
    } else {
      setInternalQuery("");
    }
    setIsOpen(false);
    onClear?.();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={displayValue}
          readOnly={inputLocked}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputLocked) return;
            if (!isControlledQuery && selected) {
              setInternalQuery(selected.label);
            }
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canCommitCustom) {
              e.preventDefault();
              commitCustom(trimmedQuery);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition",
            showClear ? "pr-9" : "pr-3",
            inputLocked && "cursor-default bg-slate-50 text-slate-700",
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
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {canCommitCustom && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitCustom(trimmedQuery)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50 transition"
            >
              <span className="font-medium text-emerald-800">
                Use “{trimmedQuery}”
              </span>
              <span className="text-xs text-slate-500">Custom</span>
            </button>
          )}
          {matches.length === 0 && !canCommitCustom && (
            <p className="px-3 py-2 text-sm text-slate-500">
              {trimmedQuery
                ? `No match for “${trimmedQuery}” — pick an option from the list`
                : "No options available"}
            </p>
          )}
          {matches.map((opt, index) => (
            <button
              key={`${opt.id}-${index}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect?.(opt);
                if (!isControlledQuery) {
                  setInternalQuery("");
                }
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50 transition"
            >
              {renderOption ? (
                renderOption(opt)
              ) : (
                <>
                  <span className="font-medium text-slate-900">{opt.label}</span>
                  {(opt.sublabel || opt.hint) && (
                    <span className="text-xs text-slate-500">{opt.sublabel || opt.hint}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
