"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type KPITone = "emerald" | "amber" | "blue" | "purple" | "rose" | "slate";

const toneStyles: Record<KPITone, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
  emerald: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-emerald-950",
    iconBg: "bg-emerald-50 border-emerald-200",
    iconText: "text-emerald-700",
  },
  amber: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-amber-950",
    iconBg: "bg-amber-50 border-amber-200",
    iconText: "text-amber-700",
  },
  blue: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-blue-950",
    iconBg: "bg-blue-50 border-blue-200",
    iconText: "text-blue-700",
  },
  purple: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-purple-950",
    iconBg: "bg-purple-50 border-purple-200",
    iconText: "text-purple-700",
  },
  rose: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-rose-950",
    iconBg: "bg-rose-50 border-rose-200",
    iconText: "text-rose-700",
  },
  slate: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-slate-900",
    iconBg: "bg-slate-100 border-slate-300",
    iconText: "text-slate-600",
  },
};

export interface HRKPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: KPITone;
  className?: string;
}

export function HRKPICard({
  label,
  value,
  subtitle,
  icon,
  tone = "emerald",
  className,
}: HRKPICardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn("p-4 rounded-2xl border shadow-xs flex items-center justify-between", styles.bg, styles.border, className)}>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <h4 className={cn("text-2xl font-black mt-1", styles.text)}>{value}</h4>
        {subtitle && <p className="text-[11px] font-semibold mt-0.5 text-slate-500">{subtitle}</p>}
      </div>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", styles.iconBg, styles.iconText)}>
        {icon}
      </div>
    </div>
  );
}
