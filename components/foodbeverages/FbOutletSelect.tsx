"use client";

import { SelectInput } from "@/components/frontoffice/ui";
import type { FbOutlet } from "@/services/food-beverages";

interface FbOutletSelectProps {
  outlets: FbOutlet[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FbOutletSelect({ outlets, value, onChange, className }: FbOutletSelectProps) {
  return (
    <SelectInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "h-10 w-full min-w-[10.5rem] shrink-0 sm:w-auto sm:max-w-[14rem]"}
    >
      {outlets.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </SelectInput>
  );
}
