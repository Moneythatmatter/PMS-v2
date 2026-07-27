"use client";

import React from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Users, Phone, Mail, FileText, MapPin, Edit, Star, ShieldCheck, Building2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupplierItem } from "@/app/data/purchaseStoresMastersData";

interface SupplierDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  onEdit: (supplier: SupplierItem) => void;
}

export function SupplierDetailsDrawer({ open, onClose, supplier, onEdit }: SupplierDetailsDrawerProps) {
  if (!supplier) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={supplier.supplierName}
      description={`Vendor Code: ${supplier.supplierCode}`}
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">Registered on {supplier.createdDate}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(supplier);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Supplier
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Banner Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                {supplier.supplierCode}
              </span>
              <h3 className="text-xl font-bold text-white">{supplier.supplierName}</h3>
              <p className="text-xs text-slate-300">Contact: <strong className="text-white">{supplier.contactPerson}</strong></p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                  supplier.status === "Active"
                    ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30"
                    : "bg-slate-700 text-slate-300 ring-slate-600"
                )}
              >
                {supplier.status}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i < supplier.rating ? "fill-amber-400" : "text-slate-600")} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>{supplier.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              <span>{supplier.email}</span>
            </div>
          </div>
        </div>

        {/* Card 1: Tax & Credit Terms */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <CreditCard className="h-4 w-4 text-emerald-700" />
            <span>Tax Registration & Credit Terms</span>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block font-medium">Payment Terms</span>
              <span className="text-sm font-bold text-emerald-800">{supplier.paymentTerms}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">GSTIN Number</span>
              <span className="font-mono font-bold text-slate-900">{supplier.gstin || "Unregistered / Exempt"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">PAN Number</span>
              <span className="font-mono font-medium text-slate-800">{supplier.panNumber || "—"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Location Details */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <MapPin className="h-4 w-4 text-emerald-700" />
            <span>Registered Office & Location</span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Registered Address</span>
              <span className="font-medium text-slate-800">{supplier.address || "No office address registered."}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">City / State</span>
              <span className="font-semibold text-slate-900">{supplier.city || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
