"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput, SelectInput, TextAreaInput, FormSection } from "@/components/frontoffice/ui";
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
  description: "",
  productCount: 0,
  status: "Active",
};

export function CategoryDrawer({ open, onClose, onSave, initialCategory }: CategoryDrawerProps) {
  const [formData, setFormData] = useState<Partial<CategoryItem>>(defaultCategoryState);
  const [errors, setErrors] = useState<{ categoryName?: string; categoryCode?: string }>({});

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (open) {
      if (initialCategory) {
        setFormData(initialCategory);
      } else {
        setFormData({ ...defaultCategoryState });
      }
      setErrors({});
    }
  }, [open, initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { categoryName?: string; categoryCode?: string } = {};

    if (!formData.categoryName?.trim()) {
      newErrors.categoryName = "Category Name is required.";
    }

    if (!formData.categoryCode?.trim()) {
      newErrors.categoryCode = "Category Code is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const finalCategory: CategoryItem = {
      id: initialCategory?.id ?? `cat-${Date.now()}`,
      categoryCode: formData.categoryCode!.trim().toUpperCase(),
      categoryName: formData.categoryName!.trim(),
      department: formData.department || "Housekeeping",
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
      description="Define inventory categories and map them to hotel departments."
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

          <FormField label="Category Code" required>
            <TextInput
              value={formData.categoryCode ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, categoryCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. CAT-LIN"
              className={`font-mono uppercase ${errors.categoryCode ? "border-red-400 focus:border-red-500" : ""}`}
            />
            {errors.categoryCode && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.categoryCode}</p>}
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
