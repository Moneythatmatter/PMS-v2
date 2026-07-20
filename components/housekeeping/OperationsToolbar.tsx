"use client";

import React from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/frontoffice/ui";
import { Drawer } from "@/components/frontoffice/ui/Drawer";

export interface StatusTabOption {
  id: string;
  label: string;
  count?: number;
}

export interface OperationsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeFilterCount?: number;
  onOpenFilters: () => void;
  statusTabs?: StatusTabOption[];
  activeStatusTab?: string;
  onStatusTabChange?: (id: string) => void;
  className?: string;
}

export function OperationsToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search by ID, room, staff or keyword…",
  activeFilterCount = 0,
  onOpenFilters,
  statusTabs,
  activeStatusTab,
  onStatusTabChange,
  className,
}: OperationsToolbarProps) {
  return (
    <div className={cn("space-y-3 select-none", className)}>
      {/* Row 1: Search (flex-1) + Filters Button */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 text-xs rounded-xl w-full bg-white border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <Button
          type="button"
          onClick={onOpenFilters}
          variant="outline"
          className={cn(
            "h-9 px-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 border transition-all cursor-pointer",
            activeFilterCount > 0
              ? "!bg-emerald-50 !text-emerald-800 !border-emerald-300 shadow-2xs font-extrabold"
              : "!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-emerald-700 text-white px-1.5 py-0.5 text-[9.5px] font-extrabold leading-none min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Row 2: Status Tabs (Optional) */}
      {statusTabs && statusTabs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {statusTabs.map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusTabChange?.(tab.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  isActive
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                      isActive ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface OperationsFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  onApply?: () => void;
  title?: string;
  activeFilterCount?: number;
  children: React.ReactNode;
}

export function OperationsFilterDrawer({
  open,
  onClose,
  onReset,
  onApply,
  title = "Filter Options",
  activeFilterCount = 0,
  children,
}: OperationsFilterDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title={title} width="md">
      <div className="flex flex-col h-full select-none space-y-4">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-3 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex-1 h-9 text-xs font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-250 rounded-xl flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset All
          </Button>

          <Button
            type="button"
            onClick={() => {
              onApply?.();
              onClose();
            }}
            className="flex-1 h-9 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs flex items-center justify-center gap-1.5"
          >
            Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
