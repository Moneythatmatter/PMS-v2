"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PurchaseFormCardProps {
  title: string;
  sectionNumber?: string;
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
  collapsibleMobile?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function PurchaseFormCard({
  title,
  sectionNumber,
  actionSlot,
  children,
  collapsibleMobile = true,
  defaultExpanded = true,
  className,
}: PurchaseFormCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "bg-white rounded-[12px] border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4 transition-all duration-200",
        className
      )}
    >
      <div
        onClick={() => collapsibleMobile && setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between border-b border-slate-100 pb-3 select-none",
          collapsibleMobile && "cursor-pointer"
        )}
      >
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>{title}</span>
          {collapsibleMobile && (
            <span className="sm:hidden text-slate-400">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
        </h4>

        <div className="flex items-center gap-3">
          {actionSlot && <div onClick={(e) => e.stopPropagation()}>{actionSlot}</div>}
          {sectionNumber && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              {sectionNumber}
            </span>
          )}
        </div>
      </div>

      <div className={cn(!isExpanded && "hidden sm:block")}>{children}</div>
    </div>
  );
}
