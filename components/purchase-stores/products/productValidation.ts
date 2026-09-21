import type { ProductItem } from "@/app/data/productMasterData";

export interface ProductValidationError {
  productName?: string;
  category?: string;
  unit?: string;
  minimumStock?: string;
  maximumStock?: string;
  parStock?: string;
}

export function validateProductForm(data: Partial<ProductItem>): {
  isValid: boolean;
  errors: ProductValidationError;
} {
  const errors: ProductValidationError = {};

  if (!data.productName || !data.productName.trim()) {
    errors.productName = "Product Name is required.";
  }

  if (!data.category || !data.category.trim()) {
    errors.category = "Category is required.";
  }

  if (!data.unit || !data.unit.trim()) {
    errors.unit = "Unit of measurement is required.";
  }

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

  return { isValid: Object.keys(errors).length === 0, errors };
}
