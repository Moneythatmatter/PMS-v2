"use client";

import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  variant?: "brand" | "warning" | "critical" | "info" | "neutral";
  href?: string;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<
  NonNullable<MetricCardProps["variant"]>,
  { iconBox: string; border: string; valueColor?: string }
> = {
  brand: {
    iconBox: "bg-emerald-50 text-emerald-700",
    border: "border-slate-200",
    valueColor: "text-slate-900",
  },
  warning: {
    iconBox: "bg-amber-50 text-amber-700",
    border: "border-slate-200",
    valueColor: "text-slate-900",
  },
  critical: {
    iconBox: "bg-rose-100 text-rose-700",
    border: "border-rose-200 bg-rose-50/40",
    valueColor: "text-rose-700",
  },
  info: {
    iconBox: "bg-blue-50 text-blue-700",
    border: "border-slate-200",
    valueColor: "text-slate-900",
  },
  neutral: {
    iconBox: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
    valueColor: "text-slate-900",
  },
};

export function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = "brand",
  href,
  onClick,
  className,
}: MetricCardProps) {
  const isInteractive = Boolean(href || onClick);
  const styles = variantStyles[variant] || variantStyles.brand;

  const content = (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-xs",
        styles.border,
        !styles.border.includes("bg-") && "bg-white",
        isInteractive && "cursor-pointer hover:border-emerald-300 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {Icon && (
          <span className={cn("rounded-md p-1.5", styles.iconBox)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={cn("mt-2 text-2xl font-bold tracking-tight", styles.valueColor || "text-slate-900")}>
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          {sublabel}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
