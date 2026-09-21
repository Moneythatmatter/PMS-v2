"use client";

import React from "react";
import { Search, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectInput } from "@/components/frontoffice/ui";
import type { MasterCategory } from "@/app/data/productMasterData";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onResetFilters: () => void;
  categoryOptions: MasterCategory[];
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  categoryOptions,
}: ProductFiltersProps) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== "all" ||
    selectedStatus !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <Filter className="h-3.5 w-3.5 text-emerald-700" />
        <span>Search & Filter Products</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Product Name, Code, or Brand…"
            className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        <div>
          <SelectInput
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by Category"
            className="h-9.5 text-xs sm:text-sm"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="flex items-center gap-2">
          <SelectInput
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by Status"
            className="h-9.5 text-xs sm:text-sm flex-1"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </SelectInput>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9.5 shrink-0 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Reset All Filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
