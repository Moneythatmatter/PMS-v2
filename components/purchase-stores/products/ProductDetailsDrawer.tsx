"use client";

import React from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/components/frontoffice/ui";
import {
  Package,
  ShoppingCart,
  Boxes,
  ShieldCheck,
  Building2,
  Tag,
  MapPin,
  FileText,
  Edit,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/app/data/productMasterData";

interface ProductDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onEdit: (product: ProductItem) => void;
}

export function ProductDetailsDrawer({
  open,
  onClose,
  product,
  onEdit,
}: ProductDetailsDrawerProps) {
  if (!product) return null;

  const isLowStock = product.parStock > 0 && product.reorderLevel >= product.parStock;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={product.productName}
      description={`Product Code: ${product.productCode}`}
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">
            Registered on {product.createdDate}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Product
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Hero Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                {product.productCode}
              </span>
              <h3 className="text-xl font-bold text-white">{product.productName}</h3>
              {product.brand && (
                <p className="text-xs text-slate-300">Brand: <span className="font-medium text-white">{product.brand}</span></p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                  product.status === "Active"
                    ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30"
                    : "bg-slate-700 text-slate-300 ring-slate-600"
                )}
              >
                {product.status}
              </span>
              <span className="text-xs text-slate-300 font-medium">UOM: {product.unit}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span>Category: <strong className="text-white">{product.category}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Supplier: <strong className="text-white">{product.preferredSupplier}</strong></span>
            </div>
          </div>
        </div>

        {/* Group 1: Basic Details Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <Package className="h-4 w-4 text-emerald-700" />
            <span>Basic Information</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Product Code</span>
              <span className="font-mono font-bold text-slate-800">{product.productCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Product Name</span>
              <span className="font-semibold text-slate-900">{product.productName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Category</span>
              <span className="font-medium text-slate-800">{product.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Unit of Measure</span>
              <span className="font-medium text-slate-800">{product.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Brand</span>
              <span className="font-medium text-slate-800">{product.brand || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Description</span>
              <span className="font-medium text-slate-800">{product.description || "No description provided."}</span>
            </div>
          </div>
        </div>

        {/* Group 2: Purchase & Financial Details */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <ShoppingCart className="h-4 w-4 text-emerald-700" />
            <span>Purchase & Financial Details</span>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block font-medium">Purchase Price</span>
              <span className="text-base font-bold text-emerald-800">{formatINR(product.purchasePrice)}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block font-medium">GST Rate (%)</span>
              <span className="text-base font-bold text-slate-900">{product.gstPercent}%</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block font-medium">Tax Type</span>
              <span className="text-base font-bold text-slate-900">{product.taxType}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Preferred Supplier</span>
              <span className="font-semibold text-slate-900">{product.preferredSupplier}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">HSN / SAC Code</span>
              <span className="font-mono font-medium text-slate-800">{product.hsnCode || "—"}</span>
            </div>
          </div>
        </div>

        {/* Group 3: Inventory Controls */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <Boxes className="h-4 w-4 text-emerald-700" />
            <span>Inventory Controls & Warehouse Storage</span>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Min Stock</span>
              <span className="text-sm font-bold text-slate-800">{product.minimumStock} {product.unit}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Max Stock</span>
              <span className="text-sm font-bold text-slate-800">{product.maximumStock} {product.unit}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-emerald-50/70 text-center">
              <span className="text-emerald-700 block text-[10px] font-semibold uppercase">Par Stock</span>
              <span className="text-sm font-bold text-emerald-800">{product.parStock} {product.unit}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-amber-50/70 text-center">
              <span className="text-amber-700 block text-[10px] font-semibold uppercase">Reorder Level</span>
              <span className="text-sm font-bold text-amber-800">{product.reorderLevel} {product.unit}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Shelf / Bin Location</span>
              <span className="font-semibold text-slate-800">{product.shelfLocation || "Unassigned"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Storage Condition</span>
              <span className="font-semibold text-slate-800">{product.storageType}</span>
            </div>
          </div>
        </div>

        {/* Group 4: Status & Audit Metadata */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Master Status & ERP Metadata</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Current ERP Status</span>
              <span
                className={cn(
                  "inline-flex mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  product.status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                )}
              >
                {product.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Created Date</span>
              <span className="font-medium text-slate-800">{product.createdDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
