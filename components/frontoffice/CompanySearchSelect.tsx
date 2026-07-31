"use client";

import { useMemo } from "react";
import { companyMasters } from "@/app/data";
import type { CompanyMaster } from "@/app/data/frontoffice/masters";
import { SearchSelect } from "@/components/ui/SearchSelect";

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
  const options = useMemo(() => {
    return companyMasters
      .filter((c) => c.status === "Active")
      .map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: `${c.code} · ${c.city}`,
        data: c,
      }));
  }, []);

  return (
    <SearchSelect
      options={options}
      value={value}
      onChange={onChange}
      selectedId={selectedCompanyId}
      onSelect={(opt) => onSelect(opt.data as CompanyMaster)}
      onClear={onClear}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      renderOption={(opt) => {
        const c = opt.data as CompanyMaster;
        return (
          <div className="flex w-full items-center justify-between">
            <span className="font-medium text-slate-900">{c.name}</span>
            <span className="text-xs text-slate-500">
              {c.code} · {c.city}
            </span>
          </div>
        );
      }}
    />
  );
}
