"use client";

import React, { useState } from "react";
import { Edit, Trash2, Ruler, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitItem } from "@/app/data/purchaseStoresMastersData";

interface UnitTableProps {
  units: UnitItem[];
  onEditUnit: (unit: UnitItem) => void;
  onDeleteUnit: (unit: UnitItem) => void;
  onResetFilters?: () => void;
}

export function UnitTable({ units, onEditUnit, onDeleteUnit, onResetFilters }: UnitTableProps) {
  const [sortField, setSortField] = useState<keyof UnitItem>("unitCode");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const handleSort = (field: keyof UnitItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedUnits = [...units].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUnits.length / itemsPerPage) || 1;
  const paginatedUnits = sortedUnits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <Ruler className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No Units Found</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          No units of measurement match your search criteria.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedUnits.map((unit) => (
          <div key={unit.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                  <Ruler className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{unit.unitName}</h4>
                  <p className="text-[11px] font-semibold text-emerald-700">{unit.unitCode}</p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  unit.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                )}
              >
                {unit.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Symbol</span>
                <span className="font-bold text-slate-900">{unit.symbol}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Description</span>
                <span className="font-medium text-slate-700">{unit.description || "—"}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-[11px] text-slate-400">Created: {unit.createdDate}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditUnit(unit)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600"
                  title="Edit Unit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteUnit(unit)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                  title="Delete Unit"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">
                  <button type="button" onClick={() => handleSort("unitCode")} className="flex items-center gap-1 hover:text-slate-900">
                    Unit Code <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button type="button" onClick={() => handleSort("unitName")} className="flex items-center gap-1 hover:text-slate-900">
                    Unit Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Symbol / Abbreviation</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {paginatedUnits.map((unit) => (
                <tr key={unit.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">{unit.unitCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{unit.unitName}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{unit.symbol}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[240px] truncate">{unit.description || "—"}</td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        unit.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                      )}
                    >
                      {unit.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 text-[11px] whitespace-nowrap">{unit.createdDate}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onEditUnit(unit)} className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600" title="Edit Unit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => onDeleteUnit(unit)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Delete Unit">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 py-2 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, units.length)}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, units.length)}</span> of <span className="font-semibold text-slate-700">{units.length}</span> units
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="px-2 font-medium text-slate-700">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
