"use client";

import { SelectInput } from "@/components/frontoffice/ui";
import type { FbOutlet } from "@/services/food-beverages";

interface FbOutletSelectProps {
  outlets: FbOutlet[];
  value: string;
  onChange: (id: string) => void;
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
    <SelectInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "h-10 w-full min-w-[10.5rem] shrink-0 sm:w-auto sm:max-w-[14rem]"}
    >
      {allowAll && <option value="">{allLabel}</option>}
      {outlets.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </SelectInput>
  );
}
