"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { companyMasters } from "@/app/data";
import type { CompanyMaster } from "@/app/data/frontoffice/masters";
import { cn } from "@/lib/utils";

interface CompanySearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (company: CompanyMaster) => void;
  onClear?: () => void;
  selectedCompanyId?: string | null;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function CompanySearchSelect({
  value,
  onChange,
  onSelect,
  onClear,
  selectedCompanyId,
  placeholder = "Search company name or code…",
  className,
  inputClassName,
}: CompanySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCompanies = useMemo(
    () => companyMasters.filter((c) => c.status === "Active"),
    [],
  );

  const matches = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q) return activeCompanies;
    return activeCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q),
    );
  }, [value, activeCompanies]);

  const selectedCompany = selectedCompanyId
    ? companyMasters.find((c) => c.id === selectedCompanyId)
    : null;

  const showDropdown =
    isOpen &&
    matches.length > 0 &&
    !(selectedCompany && selectedCompany.name === value);

  const showClear = Boolean(value.trim() || selectedCompanyId);

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    onClear?.();
  };

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
        className={cn(
          "h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
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
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-blue-50"
            >
              <span className="min-w-0 truncate font-medium text-slate-900">{c.name}</span>
              <span className="shrink-0 font-mono text-xs text-slate-500">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
