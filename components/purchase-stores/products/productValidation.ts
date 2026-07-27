import type { ProductItem } from "@/app/data/productMasterData";

export interface ProductValidationError {
  productName?: string;
  category?: string;
  unit?: string;
  purchasePrice?: string;
  gstPercent?: string;
  minimumStock?: string;
  maximumStock?: string;
  parStock?: string;
}

export function validateProductForm(data: Partial<ProductItem>): {
  isValid: boolean;
  errors: ProductValidationError;
} {
  const errors: ProductValidationError = {};

  // Required Fields
  if (!data.productName || !data.productName.trim()) {
    errors.productName = "Product Name is required.";
  }

  if (!data.category || !data.category.trim()) {
    errors.category = "Category is required.";
  }

  if (!data.unit || !data.unit.trim()) {
    errors.unit = "Unit of measurement is required.";
  }

  // Price Validation
  if (data.purchasePrice === undefined || data.purchasePrice === null || Number.isNaN(data.purchasePrice)) {
    errors.purchasePrice = "Purchase Price is required.";
  } else if (Number(data.purchasePrice) <= 0) {
    errors.purchasePrice = "Purchase Price must be a positive amount.";
  }

  // GST Validation (0 - 100)
  if (data.gstPercent === undefined || data.gstPercent === null || Number.isNaN(data.gstPercent)) {
    errors.gstPercent = "GST percentage is required.";
  } else {
    const gst = Number(data.gstPercent);
    if (gst < 0 || gst > 100) {
      errors.gstPercent = "GST % must be between 0 and 100.";
    }
  }

  // Stock Controls Validation
  const minStock = Number(data.minimumStock ?? 0);
  const maxStock = Number(data.maximumStock ?? 0);
  const parStock = Number(data.parStock ?? 0);

  if (minStock < 0) {
    errors.minimumStock = "Minimum stock cannot be negative.";
  }

  if (maxStock < minStock) {
    errors.maximumStock = `Maximum stock (${maxStock}) must be greater than or equal to Minimum stock (${minStock}).`;
  }

  if (parStock > maxStock) {
    errors.parStock = `Par stock (${parStock}) must be less than or equal to Maximum stock (${maxStock}).`;
  }

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
}
