"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ProcurementPriority = "Low" | "Medium" | "High" | "Emergency";

export const PROCUREMENT_PRIORITY_OPTIONS: {
  value: ProcurementPriority;
  dot: string;
  active: string;
  text: string;
}[] = [
  { value: "Low", dot: "bg-slate-400", active: "border-slate-400 bg-slate-50 text-slate-800", text: "text-slate-700" },
  { value: "Medium", dot: "bg-sky-500", active: "border-sky-400 bg-sky-50 text-sky-800", text: "text-sky-700" },
  { value: "High", dot: "bg-amber-500", active: "border-amber-400 bg-amber-50 text-amber-800", text: "text-amber-700" },
  { value: "Emergency", dot: "bg-red-500", active: "border-red-400 bg-red-50 text-red-700", text: "text-red-700" },
];

export function priorityTextClass(priority?: string) {
  return PROCUREMENT_PRIORITY_OPTIONS.find((o) => o.value === priority)?.text;
}

export function ProcurementFormSection({
  step,
  title,
  subtitle,
  action,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
            {step}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ProcurementSummaryRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-slate-500">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "truncate text-right font-medium",
          value ? "text-slate-900" : "text-slate-300",
          value && valueClassName,
        )}
        title={value || undefined}
      >
        {value || "Not set"}
      </dd>
    </div>
  );
}

export function PrioritySelector<T extends ProcurementPriority>({
  value,
  onChange,
  className,
}: {
  value: T | "";
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)} role="radiogroup" aria-label="Priority">
      {PROCUREMENT_PRIORITY_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value as T)}
            className={cn(
              "flex h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-xs font-semibold transition-colors",
              active ? opt.active : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", opt.dot)} />
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}
