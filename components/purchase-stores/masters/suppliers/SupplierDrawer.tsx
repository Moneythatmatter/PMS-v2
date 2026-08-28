"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput, SelectInput, TextAreaInput, FormSection } from "@/components/frontoffice/ui";
import { Sparkles, Star } from "lucide-react";
import { PAYMENT_TERMS_OPTIONS, type SupplierItem } from "@/app/data/purchaseStoresMastersData";

interface SupplierDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (supplier: SupplierItem) => void;
  initialSupplier?: SupplierItem | null;
}

const defaultSupplierState: Partial<SupplierItem> = {
  supplierCode: "",
  supplierName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  panNumber: "",
  paymentTerms: "Net 30 Days",
  address: "",
  city: "",
  rating: 4,
  status: "Active",
};

export function SupplierDrawer({ open, onClose, onSave, initialSupplier }: SupplierDrawerProps) {
  const [formData, setFormData] = useState<Partial<SupplierItem>>(defaultSupplierState);
  const [errors, setErrors] = useState<{ supplierName?: string; contactPerson?: string; phone?: string; email?: string }>({});

  const isEditing = Boolean(initialSupplier);

  useEffect(() => {
    if (open) {
      if (initialSupplier) {
        setFormData(initialSupplier);
      } else {
        const rand = Math.floor(100 + Math.random() * 900);
        setFormData({
          ...defaultSupplierState,
          supplierCode: `SUP-NEW-${rand}`,
        });
      }
      setErrors({});
    }
  }, [open, initialSupplier]);

  const handleAutoGenerateCode = () => {
    const prefix = formData.supplierName ? formData.supplierName.slice(0, 3).toUpperCase() : "SUP";
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, supplierCode: `SUP-${prefix}-${rand}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { supplierName?: string; contactPerson?: string; phone?: string; email?: string } = {};

    if (!formData.supplierName || !formData.supplierName.trim()) {
      newErrors.supplierName = "Vendor Name is required.";
    }
    if (!formData.contactPerson || !formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact Person is required.";
    }
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email address is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const finalSupplier: SupplierItem = {
      id: initialSupplier?.id ?? `sup-${Date.now()}`,
      supplierCode: formData.supplierCode || `SUP-${Date.now().toString().slice(-4)}`,
      supplierName: formData.supplierName?.trim() || "",
      contactPerson: formData.contactPerson?.trim() || "",
      phone: formData.phone?.trim() || "",
      email: formData.email?.trim() || "",
      gstin: formData.gstin?.trim() || undefined,
      panNumber: formData.panNumber?.trim() || undefined,
      paymentTerms: formData.paymentTerms || "Net 30 Days",
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      rating: Number(formData.rating ?? 4),
      status: formData.status || "Active",
      createdDate: initialSupplier?.createdDate ?? todayStr,
    };

    onSave(finalSupplier);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Vendor: ${initialSupplier?.supplierCode}` : "Add Vendor"}
      description="Register vendor contact profiles, GSTIN details, and credit payment terms."
      width="2xl"
      className="max-w-full sm:max-w-[700px]"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5"
          >
            {isEditing ? "Save Changes" : "Save Vendor"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        {/* SECTION 1: Basic Vendor Info */}
        <FormSection title="Section 1: Vendor Profile & Contact" columns={2}>
          <FormField label="Vendor / Company Name" required className="sm:col-span-2">
            <TextInput
              value={formData.supplierName ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, supplierName: e.target.value }))}
              placeholder="e.g. Apex Linen Supplies Pvt Ltd"
              className={errors.supplierName ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.supplierName && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.supplierName}</p>}
          </FormField>

          <FormField label="Vendor Code">
            <div className="flex gap-2">
              <TextInput
                value={formData.supplierCode ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, supplierCode: e.target.value }))}
                placeholder="e.g. SUP-APX"
                className="flex-1 font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Auto
              </button>
            </div>
          </FormField>

          <FormField label="Contact Person Name" required>
            <TextInput
              value={formData.contactPerson ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
              placeholder="e.g. Rakesh Sharma"
              className={errors.contactPerson ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.contactPerson && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.contactPerson}</p>}
          </FormField>

          <FormField label="Phone Number" required>
            <TextInput
              value={formData.phone ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. +91 98765 43210"
              className={errors.phone ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.phone && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.phone}</p>}
          </FormField>

          <FormField label="Email Address" required>
            <TextInput
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. orders@apexlinen.com"
              className={errors.email ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.email && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.email}</p>}
          </FormField>
        </FormSection>

        {/* SECTION 2: Tax & Financial Info */}
        <FormSection title="Section 2: Tax & Credit Payment Terms" columns={2}>
          <FormField label="GSTIN Number">
            <TextInput
              value={formData.gstin ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, gstin: e.target.value }))}
              placeholder="e.g. 27AAACA12341Z5"
              className="font-mono uppercase text-xs"
            />
          </FormField>

          <FormField label="PAN Number">
            <TextInput
              value={formData.panNumber ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, panNumber: e.target.value }))}
              placeholder="e.g. AAACA12341"
              className="font-mono uppercase text-xs"
            />
          </FormField>

          <FormField label="Payment Terms" required className="sm:col-span-2">
            <SelectInput
              value={formData.paymentTerms ?? "Net 30 Days"}
              onChange={(e) => setFormData((p) => ({ ...p, paymentTerms: e.target.value as any }))}
            >
              {PAYMENT_TERMS_OPTIONS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </FormSection>

        {/* SECTION 3: Address Details */}
        <FormSection title="Section 3: Address & Location" columns={2}>
          <FormField label="Registered Office Address" className="sm:col-span-2">
            <TextAreaInput
              value={formData.address ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="Full street address, industrial estate..."
              rows={2}
            />
          </FormField>

          <FormField label="City / Region" className="sm:col-span-2">
            <TextInput
              value={formData.city ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Mumbai, New Delhi, Bengaluru"
            />
          </FormField>
        </FormSection>

        {/* SECTION 4: Rating & Status */}
        <FormSection title="Section 4: Performance & Status" columns={2}>
          <FormField label="Performance Rating">
            <SelectInput
              value={formData.rating ?? 4}
              onChange={(e) => setFormData((p) => ({ ...p, rating: Number(e.target.value) }))}
            >
              <option value={5}>5 Stars - Premium Preferred</option>
              <option value={4}>4 Stars - Highly Reliable</option>
              <option value={3}>3 Stars - Standard Vendor</option>
              <option value={2}>2 Stars - Needs Improvement</option>
              <option value={1}>1 Star - Under Review</option>
            </SelectInput>
          </FormField>

          <FormField label="Vendor Status">
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sup-status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={() => setFormData((p) => ({ ...p, status: "Active" }))}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Active
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sup-status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={() => setFormData((p) => ({ ...p, status: "Inactive" }))}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Inactive
                </span>
              </label>
            </div>
          </FormField>
        </FormSection>
      </form>
    </Drawer>
  );
}
