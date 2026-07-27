"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "./ProductForm";
import { validateProductForm, type ProductValidationError } from "./productValidation";
import type { ProductItem } from "@/app/data/productMasterData";

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: ProductItem) => void;
  initialProduct?: ProductItem | null;
}

const defaultProductState: Partial<ProductItem> = {
  productCode: "",
  productName: "",
  category: "",
  unit: "",
  brand: "",
  description: "",
  preferredSupplier: "",
  purchasePrice: 0,
  gstPercent: 18,
  hsnCode: "",
  taxType: "Exclusive",
  minimumStock: 10,
  maximumStock: 100,
  parStock: 50,
  reorderLevel: 20,
  shelfLocation: "",
  storageType: "Dry Storage",
  status: "Active",
};

export function ProductDrawer({
  open,
  onClose,
  onSave,
  initialProduct,
}: ProductDrawerProps) {
  const [formData, setFormData] = useState<Partial<ProductItem>>(defaultProductState);
  const [errors, setErrors] = useState<ProductValidationError>({});

  const isEditing = Boolean(initialProduct);

  useEffect(() => {
    if (open) {
      if (initialProduct) {
        setFormData(initialProduct);
      } else {
        // Auto-generate initial code for new product
        const randomNum = Math.floor(100 + Math.random() * 900);
        setFormData({
          ...defaultProductState,
          productCode: `PRD-NEW-${randomNum}`,
        });
      }
      setErrors({});
    }
  }, [open, initialProduct]);

  const handleAutoGenerateCode = () => {
    const prefix = formData.category
      ? formData.category.slice(0, 3).toUpperCase()
      : "GEN";
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      productCode: `PRD-${prefix}-${randomNum}`,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateProductForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const finalProduct: ProductItem = {
      id: initialProduct?.id ?? `prd-${Date.now()}`,
      productCode: formData.productCode || `PRD-${Date.now().toString().slice(-4)}`,
      productName: formData.productName?.trim() || "",
      category: formData.category || "",
      unit: formData.unit || "",
      brand: formData.brand?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      preferredSupplier: formData.preferredSupplier || "Unassigned",
      purchasePrice: Number(formData.purchasePrice),
      gstPercent: Number(formData.gstPercent),
      hsnCode: formData.hsnCode?.trim() || undefined,
      taxType: formData.taxType || "Exclusive",
      minimumStock: Number(formData.minimumStock ?? 0),
      maximumStock: Number(formData.maximumStock ?? 0),
      parStock: Number(formData.parStock ?? 0),
      reorderLevel: Number(formData.reorderLevel ?? 0),
      shelfLocation: formData.shelfLocation?.trim() || undefined,
      storageType: formData.storageType || "Dry Storage",
      status: formData.status || "Active",
      createdDate: initialProduct?.createdDate ?? todayStr,
      updatedDate: isEditing ? todayStr : undefined,
    };

    onSave(finalProduct);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${initialProduct?.productCode}` : "Add New Product"}
      description={
        isEditing
          ? "Modify product specification, pricing, and inventory control parameters."
          : "Register a new master product into the Hotel PMS purchase & stores catalog."
      }
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
            {isEditing ? "Save Changes" : "Save Product"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pb-4">
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onAutoGenerateCode={handleAutoGenerateCode}
        />
      </form>
    </Drawer>
  );
}
