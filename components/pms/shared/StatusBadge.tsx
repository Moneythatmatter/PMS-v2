"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "critical" | "info" | "neutral";

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  size?: "sm" | "md";
}

const variantMap: Record<StatusVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({
  status,
  variant = "neutral",
  className,
  size = "sm",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        variantMap[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
