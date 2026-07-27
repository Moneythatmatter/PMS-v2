"use client";

import React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FOSearchToolbar } from "@/components/frontoffice/ui/FOSearchToolbar";
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
  selectionBar?: React.ReactNode;
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
  selectionBar,
  className,
}: OperationsToolbarProps) {
  return (
    <div className={cn(className)}>
      <FOSearchToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filterPills={
          statusTabs && statusTabs.length > 0 && onStatusTabChange
            ? {
                active: activeStatusTab ?? statusTabs[0]?.id ?? "all",
                onChange: onStatusTabChange,
                options: statusTabs.map((tab) => ({
                  id: tab.id,
                  label:
                    typeof tab.count === "number" ? `${tab.label} (${tab.count})` : tab.label,
                })),
              }
            : undefined
        }
        beforeFilters={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 shrink-0 gap-1.5",
              activeFilterCount > 0 && "border-emerald-300 bg-emerald-50 text-emerald-800",
            )}
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-semibold text-white">
                {activeFilterCount > 9 ? "!" : activeFilterCount}
              </span>
            )}
          </Button>
        }
        selectionBar={selectionBar}
      />
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
      <div className="flex h-full select-none flex-col space-y-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">{children}</div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold"
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
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl !bg-emerald-700 text-xs font-bold text-white hover:!bg-emerald-800"
          >
            Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
