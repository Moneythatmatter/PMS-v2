"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KPILuggageCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderColor: string;
  isActive: boolean;
  onClick: () => void;
}

export function KPILuggageCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderColor,
  isActive,
  onClick,
}: KPILuggageCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isActive ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/5" : borderColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-550">{title}</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">{value}</h3>
          <p className="mt-0.5 text-[10px] text-slate-600 font-bold">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2 shadow-xs", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
    </div>
  );
}
