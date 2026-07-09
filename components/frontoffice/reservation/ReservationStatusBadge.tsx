import { cn } from "@/lib/utils";
import type { ReservationStatus } from "@/app/data/types";

const statusStyles: Record<ReservationStatus, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Checked In": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Reserved: "bg-sky-50 text-sky-700 ring-sky-200",
  "Checked Out": "bg-slate-100 text-slate-600 ring-slate-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
  "In-House": "bg-violet-50 text-violet-700 ring-violet-200",
};

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

export function ReservationStatusBadge({
  status,
  className,
}: ReservationStatusBadgeProps) {
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
