import React from "react";
import { cn } from "@/lib/utils";

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  NORMAL: "border-amber-200 bg-amber-50 text-amber-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  URGENT: "border-red-200 bg-red-600 text-white",
};

export function priorityBadgeClass(priority?: string | null): string {
  return (
    PRIORITY_BADGE[String(priority ?? "").toUpperCase()] ??
    "border-slate-200 bg-slate-50 text-slate-600"
  );
}

export function formatShortDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DetailItem({
  icon: Icon,
  label,
  truncate = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  truncate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className={cn("mt-0.5 font-semibold text-slate-800", truncate && "truncate")}>
        {children}
      </dd>
    </div>
  );
}
