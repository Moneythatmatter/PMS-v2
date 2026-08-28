"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput, TextAreaInput, FormSection } from "@/components/frontoffice/ui";
import type { UnitItem } from "@/app/data/purchaseStoresMastersData";

interface UnitDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (unit: UnitItem) => void;
  initialUnit?: UnitItem | null;
}

const defaultUnitState: Partial<UnitItem> = {
  unitCode: "",
  unitName: "",
  symbol: "",
  description: "",
  status: "Active",
};

export function UnitDrawer({ open, onClose, onSave, initialUnit }: UnitDrawerProps) {
  const [formData, setFormData] = useState<Partial<UnitItem>>(defaultUnitState);
  const [errors, setErrors] = useState<{ unitName?: string; unitCode?: string; symbol?: string }>({});

  const isEditing = Boolean(initialUnit);

  useEffect(() => {
    if (open) {
      if (initialUnit) {
        setFormData(initialUnit);
      } else {
        setFormData({ ...defaultUnitState });
      }
      setErrors({});
    }
  }, [open, initialUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { unitName?: string; unitCode?: string; symbol?: string } = {};

    if (!formData.unitName?.trim()) {
      newErrors.unitName = "Unit Name is required.";
    }
    if (!formData.unitCode?.trim()) {
      newErrors.unitCode = "Unit Code is required.";
    }
    if (!formData.symbol || !formData.symbol.trim()) {
      newErrors.symbol = "Symbol / Abbreviation is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const finalUnit: UnitItem = {
      id: initialUnit?.id ?? `u-${Date.now()}`,
      unitCode: formData.unitCode!.trim().toUpperCase(),
      unitName: formData.unitName?.trim() || "",
      symbol: formData.symbol?.trim() || "",
      description: formData.description?.trim() || undefined,
      status: formData.status || "Active",
      createdDate: initialUnit?.createdDate ?? todayStr,
    };

    onSave(finalUnit);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Unit: ${initialUnit?.unitCode}` : "Add Unit of Measurement"}
      description="Define standard UOM units used across purchasing, inventory, and stock ledgers."
      width="xl"
      className="max-w-full sm:max-w-[600px]"
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
            {isEditing ? "Save Changes" : "Save Unit"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-4">
        <FormSection title="Unit Information" columns={2}>
          <FormField label="Unit Name" required className="sm:col-span-2">
            <TextInput
              value={formData.unitName ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, unitName: e.target.value }))}
              placeholder="e.g. Kilograms, Pieces, Canisters"
              className={errors.unitName ? "border-red-400 focus:border-red-500" : ""}
            />
            {errors.unitName && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.unitName}</p>}
          </FormField>

          <FormField label="Unit Code" required>
            <TextInput
              value={formData.unitCode ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, unitCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. UNT-PCS"
              className={`font-mono uppercase ${errors.unitCode ? "border-red-400 focus:border-red-500" : ""}`}
            />
            {errors.unitCode && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.unitCode}</p>}
          </FormField>

          <FormField label="Symbol / Abbreviation" required>
            <TextInput
              value={formData.symbol ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, symbol: e.target.value }))}
              placeholder="e.g. Kg, Pcs, Can, Ltr"
              className={errors.symbol ? "border-red-400 focus:border-red-500 font-bold" : "font-bold"}
            />
            {errors.symbol && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.symbol}</p>}
          </FormField>

          <FormField label="Description" className="sm:col-span-2">
            <TextAreaInput
              value={formData.description ?? ""}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of when this unit is applied..."
              rows={2}
            />
          </FormField>

          <FormField label="Status" className="sm:col-span-2">
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="unit-status"
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
                  name="unit-status"
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
