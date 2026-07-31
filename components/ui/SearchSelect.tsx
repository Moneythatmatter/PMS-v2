"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
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
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlledQuery = onChange !== undefined;
  const query = isControlledQuery ? value : internalQuery;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = selectedId ? options.find((o) => o.id === selectedId) : null;
  const displayValue = isOpen ? query : (selected?.label ?? query);

  const matches = options.filter((opt) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.id.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.hint && opt.hint.toLowerCase().includes(q))
    );
  });

  const showDropdown = isOpen && matches.length > 0;
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

  const handleInputChange = (val: string) => {
    if (isControlledQuery) {
      onChange?.(val);
    } else {
      setInternalQuery(val);
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (!isControlledQuery && selected) {
              setInternalQuery(selected.label);
            }
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition",
            showClear ? "pr-9" : "pr-3",
            inputClassName
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
          {matches.map((opt) => (
            <button
              key={opt.id}
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
