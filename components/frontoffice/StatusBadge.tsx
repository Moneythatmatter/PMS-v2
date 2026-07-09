import { cn } from "@/lib/utils";
import type { FrontOfficeStatus } from "@/app/data/types";

const statusStyles: Record<FrontOfficeStatus, string> = {
  Confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  "Checked In": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Checked Out": "bg-slate-100 text-slate-600 ring-slate-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
};

interface StatusBadgeProps {
  status: FrontOfficeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
