"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput, SelectInput, TextAreaInput, FormSection } from "@/components/frontoffice/ui";
import { Sparkles } from "lucide-react";
import { DEPARTMENT_OPTIONS, type CategoryItem } from "@/app/data/purchaseStoresMastersData";

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: CategoryItem) => void;
  initialCategory?: CategoryItem | null;
}

const defaultCategoryState: Partial<CategoryItem> = {
  categoryCode: "",
  categoryName: "",
  department: "Housekeeping",
  defaultTaxRate: 18,
  description: "",
  productCount: 0,
  status: "Active",
};

export function CategoryDrawer({ open, onClose, onSave, initialCategory }: CategoryDrawerProps) {
  const [formData, setFormData] = useState<Partial<CategoryItem>>(defaultCategoryState);
  const [errors, setErrors] = useState<{ categoryName?: string; defaultTaxRate?: string }>({});

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (open) {
      if (initialCategory) {
        setFormData(initialCategory);
      } else {
        const rand = Math.floor(100 + Math.random() * 900);
        setFormData({
          ...defaultCategoryState,
          categoryCode: `CAT-NEW-${rand}`,
        });
      }
      setErrors({});
    }
  }, [open, initialCategory]);

  const handleAutoGenerateCode = () => {
    const prefix = formData.categoryName ? formData.categoryName.slice(0, 3).toUpperCase() : "CAT";
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, categoryCode: `CAT-${prefix}-${rand}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { categoryName?: string; defaultTaxRate?: string } = {};

    if (!formData.categoryName || !formData.categoryName.trim()) {
      newErrors.categoryName = "Category Name is required.";
    }

    const tax = Number(formData.defaultTaxRate);
    if (formData.defaultTaxRate === undefined || Number.isNaN(tax) || tax < 0 || tax > 100) {
      newErrors.defaultTaxRate = "Default Tax Rate % must be between 0 and 100.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const finalCategory: CategoryItem = {
      id: initialCategory?.id ?? `cat-${Date.now()}`,
      categoryCode: formData.categoryCode || `CAT-${Date.now().toString().slice(-4)}`,
      categoryName: formData.categoryName?.trim() || "",
      department: formData.department || "Housekeeping",
      defaultTaxRate: Number(formData.defaultTaxRate ?? 18),
      description: formData.description?.trim() || undefined,
      productCount: initialCategory?.productCount ?? 0,
      status: formData.status || "Active",
      createdDate: initialCategory?.createdDate ?? todayStr,
    };

    onSave(finalCategory);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Category: ${initialCategory?.categoryCode}` : "Add Product Category"}
      description="Define inventory categories and default GST tax rates for hotel procurement."
      width="xl"
      className="max-w-full sm:max-w-[650px]"
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
            {isEditing ? "Save Changes" : "Save Category"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-4">
        <FormSection title="Category Information" columns={2}>
          <FormField label="Category Name" required className="sm:col-span-2">
            <TextInput
              value={formData.categoryName ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, categoryName: e.target.value }))}
              placeholder="e.g. Housekeeping Linen, F&B Groceries, Cleaning Chemicals"
              className={errors.categoryName ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.categoryName && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.categoryName}</p>}
          </FormField>

          <FormField label="Category Code">
            <div className="flex gap-2">
              <TextInput
                value={formData.categoryCode ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, categoryCode: e.target.value }))}
                placeholder="e.g. CAT-LIN"
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

          <FormField label="Department Mapping" required>
            <SelectInput
              value={formData.department ?? "Housekeeping"}
              onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Default Tax Rate (%)" required>
            <TextInput
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.defaultTaxRate ?? 18}
              onChange={(e) => setFormData((p) => ({ ...p, defaultTaxRate: Number(e.target.value) }))}
              placeholder="e.g. 18"
              className={errors.defaultTaxRate ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.defaultTaxRate && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.defaultTaxRate}</p>}
          </FormField>

          <FormField label="Description" className="sm:col-span-2">
            <TextAreaInput
              value={formData.description ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief summary of items covered under this category..."
              rows={2}
            />
          </FormField>

          <FormField label="Status" className="sm:col-span-2">
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cat-status"
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
                  name="cat-status"
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
