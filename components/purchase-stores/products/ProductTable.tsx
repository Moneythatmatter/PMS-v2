"use client";

import React, { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Package,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Tag,
  Building2,
} from "lucide-react";
import { formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/app/data/productMasterData";

export type SortField = "productCode" | "productName" | "category" | "purchasePrice" | "status" | "createdDate";
export type SortOrder = "asc" | "desc";

interface ProductTableProps {
  products: ProductItem[];
  isLoading?: boolean;
  onViewProduct: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
  onDeleteProduct: (product: ProductItem) => void;
  onResetFilters?: () => void;
}

export function ProductTable({
  products,
  isLoading = false,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onResetFilters,
}: ProductTableProps) {
  const [sortField, setSortField] = useState<SortField>("productCode");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aVal: string | number = a[sortField] ?? "";
    let bVal: string | number = b[sortField] ?? "";

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded-lg bg-slate-100" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full rounded-xl bg-slate-50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No Products Found</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          No inventory products match your current search queries or applied filter criteria.
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
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{product.productName}</h4>
                  <p className="text-[11px] font-semibold text-emerald-700 tracking-wider">
                    {product.productCode}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  product.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                )}
              >
                {product.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                <span className="font-medium text-slate-800">{product.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Supplier</span>
                <span className="font-medium text-slate-800 truncate block">{product.preferredSupplier}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Price / Unit</span>
                <span className="font-bold text-slate-900">
                  {formatINR(product.purchasePrice)}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">/ {product.unit}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">GST Rate</span>
                <span className="font-medium text-slate-800">{product.gstPercent}%</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-[11px] text-slate-400">Created: {product.createdDate}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onViewProduct(product)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEditProduct(product)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                  title="Edit Product"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="max-h-[620px] overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort("productCode")}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Product Code
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort("productName")}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Product Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort("category")}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Category
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">Unit</th>
                <th className="py-3.5 px-4 font-semibold">Preferred Supplier</th>
                <th className="py-3.5 px-4 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort("purchasePrice")}
                    className="flex items-center gap-1 ml-auto hover:text-slate-900"
                  >
                    Price (INR)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center font-semibold">GST %</th>
                <th className="py-3.5 px-4 text-center font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 mx-auto hover:text-slate-900"
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center font-semibold">Created</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-slate-50/80 group"
                >
                  <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">
                    {product.productCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 font-semibold group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">{product.productName}</p>
                        {product.brand && (
                          <p className="text-[11px] text-slate-400 font-normal">Brand: {product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {product.unit}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">
                    <span className="flex items-center gap-1" title={product.preferredSupplier}>
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{product.preferredSupplier}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatINR(product.purchasePrice)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600 whitespace-nowrap">
                    {product.gstPercent}%
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        product.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                      )}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 text-[11px] whitespace-nowrap">
                    {product.createdDate}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewProduct(product)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Product"
                      >
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
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {Math.min((currentPage - 1) * itemsPerPage + 1, products.length)}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(currentPage * itemsPerPage, products.length)}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{products.length}</span> products
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
