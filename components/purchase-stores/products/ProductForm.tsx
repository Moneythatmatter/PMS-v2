"use client";

import React from "react";
import { Sparkles, Package, ShoppingCart, Boxes, ShieldCheck } from "lucide-react";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  FormSection,
} from "@/components/frontoffice/ui";
import {
  STORAGE_TYPE_OPTIONS,
  TAX_TYPE_OPTIONS,
  type ProductItem,
  type ProductStatus,
  type StorageType,
  type TaxType,
  type MasterCategory,
  type MasterUnit,
  type MasterSupplier,
} from "@/app/data/productMasterData";
import type { ProductValidationError } from "./productValidation";

interface ProductFormProps {
  formData: Partial<ProductItem>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductItem>>>;
  errors: ProductValidationError;
  onAutoGenerateCode: () => void;
  categoryOptions: MasterCategory[];
  unitOptions: MasterUnit[];
  supplierOptions: MasterSupplier[];
}

export function ProductForm({
  formData,
  setFormData,
  errors,
  onAutoGenerateCode,
  categoryOptions,
  unitOptions,
  supplierOptions,
}: ProductFormProps) {
  const handleChange = (field: keyof ProductItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Basic Information */}
      <FormSection title="Section 1: Basic Information" columns={2}>
        <FormField label="Product Name" required className="sm:col-span-2">
          <TextInput
            value={formData.productName ?? ""}
            onChange={(e) => handleChange("productName", e.target.value)}
            placeholder="e.g. Bedsheet (King Size 300TC)"
            className={errors.productName ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.productName && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.productName}</p>
          )}
        </FormField>

        <FormField label="Product Code">
          <div className="flex gap-2">
            <TextInput
              value={formData.productCode ?? ""}
              onChange={(e) => handleChange("productCode", e.target.value)}
              placeholder="e.g. PRD-LIN-001"
              className="flex-1 font-mono uppercase"
            />
            <button
              type="button"
              onClick={onAutoGenerateCode}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors shrink-0"
              title="Auto Generate Product Code"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Auto
            </button>
          </div>
        </FormField>

        <FormField label="Category" required>
          <SelectInput
            value={formData.category ?? ""}
            onChange={(e) => handleChange("category", e.target.value)}
            className={errors.category ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          >
            <option value="">Select Category Master…</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </SelectInput>
          {errors.category && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.category}</p>
          )}
        </FormField>

        <FormField label="Unit of Measure (UOM)" required>
          <SelectInput
            value={formData.unit ?? ""}
            onChange={(e) => handleChange("unit", e.target.value)}
            className={errors.unit ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          >
            <option value="">Select Unit Master…</option>
            {unitOptions.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </SelectInput>
          {errors.unit && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.unit}</p>
          )}
        </FormField>

        <FormField label="Brand / Manufacturer">
          <TextInput
            value={formData.brand ?? ""}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="e.g. Bombay Dyeing Pro, Diversey, Philips"
          />
        </FormField>

        <FormField label="Product Description" className="sm:col-span-2">
          <TextAreaInput
            value={formData.description ?? ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Brief item specification, specifications, material details..."
            rows={2}
          />
        </FormField>
      </FormSection>

      {/* SECTION 2: Purchase Information */}
      <FormSection title="Section 2: Purchase & Financial Information" columns={2}>
        <FormField label="Preferred Supplier">
          <SelectInput
            value={formData.preferredSupplier ?? ""}
            onChange={(e) => handleChange("preferredSupplier", e.target.value)}
          >
            <option value="">Select Supplier Master…</option>
            {supplierOptions.map((sup) => (
              <option key={sup.id} value={sup.name}>
                {sup.name}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Purchase Price (₹)" required>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={formData.purchasePrice ?? ""}
            onChange={(e) => handleChange("purchasePrice", e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0.00"
            className={errors.purchasePrice ? "border-red-400 focus:border-red-500 focus:ring-red-200 font-semibold" : "font-semibold"}
          />
          {errors.purchasePrice && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.purchasePrice}</p>
          )}
        </FormField>

        <FormField label="GST Rate (%)" required>
          <TextInput
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.gstPercent ?? ""}
            onChange={(e) => handleChange("gstPercent", e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 18"
            className={errors.gstPercent ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.gstPercent && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.gstPercent}</p>
          )}
        </FormField>

        <FormField label="HSN / SAC Code">
          <TextInput
            value={formData.hsnCode ?? ""}
            onChange={(e) => handleChange("hsnCode", e.target.value)}
            placeholder="e.g. 63022100"
            className="font-mono text-xs"
          />
        </FormField>

        <FormField label="Tax Type">
          <SelectInput
            value={formData.taxType ?? "Exclusive"}
            onChange={(e) => handleChange("taxType", e.target.value as TaxType)}
          >
            {TAX_TYPE_OPTIONS.map((tax) => (
              <option key={tax} value={tax}>
                {tax}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </FormSection>

      {/* SECTION 3: Inventory Controls & Storage */}
      <FormSection title="Section 3: Inventory Controls & Storage" columns={2}>
        <FormField label="Minimum Stock Level">
          <TextInput
            type="number"
            min="0"
            value={formData.minimumStock ?? 0}
            onChange={(e) => handleChange("minimumStock", Number(e.target.value))}
            className={errors.minimumStock ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.minimumStock && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.minimumStock}</p>
          )}
        </FormField>

        <FormField label="Maximum Stock Level">
          <TextInput
            type="number"
            min="0"
            value={formData.maximumStock ?? 0}
            onChange={(e) => handleChange("maximumStock", Number(e.target.value))}
            className={errors.maximumStock ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.maximumStock && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.maximumStock}</p>
          )}
        </FormField>

        <FormField label="Par Stock Level">
          <TextInput
            type="number"
            min="0"
            value={formData.parStock ?? 0}
            onChange={(e) => handleChange("parStock", Number(e.target.value))}
            className={errors.parStock ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
          />
          {errors.parStock && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.parStock}</p>
          )}
        </FormField>

        <FormField label="Reorder Trigger Level">
          <TextInput
            type="number"
            min="0"
            value={formData.reorderLevel ?? 0}
            onChange={(e) => handleChange("reorderLevel", Number(e.target.value))}
          />
        </FormField>

        <FormField label="Shelf Location / Bay">
          <TextInput
            value={formData.shelfLocation ?? ""}
            onChange={(e) => handleChange("shelfLocation", e.target.value)}
            placeholder="e.g. Rack A-01"
          />
        </FormField>

        <FormField label="Storage Type Condition">
          <SelectInput
            value={formData.storageType ?? "Dry Storage"}
            onChange={(e) => handleChange("storageType", e.target.value as StorageType)}
          >
            {STORAGE_TYPE_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </FormSection>

      {/* SECTION 4: Status */}
      <FormSection title="Section 4: Master Status" columns={1}>
        <div className="flex items-center gap-6 py-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="Active"
              checked={formData.status === "Active"}
              onChange={() => handleChange("status", "Active" as ProductStatus)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Active
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="Inactive"
              checked={formData.status === "Inactive"}
              onChange={() => handleChange("status", "Inactive" as ProductStatus)}
              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Inactive
            </span>
          </label>
        </div>
      </FormSection>
    </div>
  );
}
