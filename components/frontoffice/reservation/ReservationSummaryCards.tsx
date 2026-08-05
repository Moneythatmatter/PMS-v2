"use client";

import { BedDouble, Calendar, UserCheck, Wallet } from "lucide-react";
import type { ReservationFilter, ReservationSummaryStat } from "@/app/data/types";
import { cn } from "@/lib/utils";

const iconMap = {
  calendar: Calendar,
  "user-check": UserCheck,
  bed: BedDouble,
  wallet: Wallet,
};

const filterMap: Partial<Record<string, ReservationFilter>> = {
  Total: "all",
  "Arriving Today": "arriving-today",
  "In-House": "in-house",
  Outstanding: "outstanding",
};

interface ReservationSummaryCardsProps {
  stats: ReservationSummaryStat[];
  activeFilter?: ReservationFilter;
  onFilterClick?: (filter: ReservationFilter) => void;
}

export function ReservationSummaryCards({
  stats,
  activeFilter = "all",
  onFilterClick,
}: ReservationSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        const filterId = filterMap[stat.label] ?? "all";
        const isActive = activeFilter === filterId;

        return (
          <button
            key={stat.label}
            type="button"
            onClick={() => onFilterClick?.(filterId)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 cursor-pointer",
              isActive
                ? "border-emerald-300 ring-2 ring-emerald-100"
                : "border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
            )}
          >
            <div
              className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
              style={{ background: `linear-gradient(135deg, ${stat.color}12, transparent)` }}
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
