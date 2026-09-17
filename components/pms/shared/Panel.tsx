"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  headerClassName?: string;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

export function Panel({
  title,
  subtitle,
  action,
  icon: Icon,
  headerClassName,
  bodyClassName,
  className,
  children,
}: PanelProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col", className)}>
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-200/80 px-4 py-3 bg-slate-50/50",
          headerClassName
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-emerald-700 shrink-0" />}
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className={cn("p-4 flex-1", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
