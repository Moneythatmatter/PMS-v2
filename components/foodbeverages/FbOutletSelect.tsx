"use client";

import { Store } from "lucide-react";
import { SelectInput } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

type OutletOption = { id: string; name: string };

interface FbOutletSelectProps {
  outlets: OutletOption[];
  value: string;
  onChange: (id: string) => void;
  /** Sizing/layout classes — applied to the wrapper; the select fills it. */
  className?: string;
  /** When true, first option is “All outlets” with empty value. */
  allowAll?: boolean;
  allLabel?: string;
}

export function FbOutletSelect({
  outlets,
  value,
  onChange,
  className,
  allowAll = false,
  allLabel = "All outlets",
}: FbOutletSelectProps) {
  return (
    <div
      className={cn(
        "relative",
        className ?? "h-10 w-full min-w-[10.5rem] shrink-0 sm:w-auto sm:max-w-[14rem]",
      )}
    >
      <Store
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700"
        aria-hidden
      />
      <SelectInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Outlet"
        className="h-full min-h-8 w-full pl-9"
      >
        {allowAll && <option value="">{allLabel}</option>}
        {outlets.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}
