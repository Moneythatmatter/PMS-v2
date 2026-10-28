import React from "react";
import { cn } from "@/lib/utils";

const KPI_TONES = {
  sky: { bar: "bg-sky-500", icon: "bg-sky-50 text-sky-700", note: "text-slate-500" },
  rose: { bar: "bg-rose-500", icon: "bg-rose-50 text-rose-700", note: "text-slate-500" },
  amber: { bar: "bg-amber-500", icon: "bg-amber-50 text-amber-700", note: "text-slate-500" },
  emerald: { bar: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-700", note: "text-emerald-700 font-semibold" },
  slate: { bar: "bg-slate-400", icon: "bg-slate-100 text-slate-600", note: "text-slate-500" },
} as const;

export type KpiTone = keyof typeof KPI_TONES;

export function KpiCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  strong,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
  strong?: boolean;
}) {
  const t = KPI_TONES[tone];
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border bg-white p-4 shadow-2xs",
        strong ? "border-slate-300" : "border-slate-200",
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1", t.bar)} />
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1.5 truncate text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className={cn("mt-0.5 truncate text-[11px]", tone === "rose" && strong ? "text-rose-700 font-semibold" : t.note)}>
        {note}
      </p>
    </div>
  );
}
