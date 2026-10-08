export interface RecipeIngredient {
  id: string;
  lineNo: number;
  /** ps_products.id — Purchase & Stores material master. */
  materialId: string;
  productCode: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  stockUnit: string;
  conversionFactor: number;
  stockQuantity: number;
  wastagePercent: number;
  grossStockQuantity: number;
  unitCost: number;
  lineCost: number;
  onHandIssueStore: number | null;
  onHandTotal: number;
  remarks: string;
}

export interface Recipe {
  id: string;
  recipeCode: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  menuItemId: string | null;
  menuItemName: string;
  menuItemPrice: number | null;
  yieldQuantity: number;
  yieldUnit: string;
  sellingPrice: number;
  wastagePercent: number;
  prepTimeMinutes: number | null;
  issueWarehouseId: string | null;
  issueWarehouseName: string;
  instructions: string;
  notes: string;
  isActive: boolean;
  status: "Active" | "Inactive";
  batchCost: number;
  costPerPortion: number;
  foodCostPercent: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export type RecipeIngredientInput = {
  id?: string;
  materialId: string;
  quantity: number;
  unit: string;
  wastagePercent: number;
  remarks?: string;
};

export type RecipeInput = Omit<
  Partial<Recipe>,
  "ingredients" | "recipeCode" | "categoryName" | "menuItemName" | "issueWarehouseName"
> & { ingredients?: RecipeIngredientInput[] };

export type RecipeConsumeInput = {
  portions: number;
  warehouseId?: string;
  reference?: string;
  remarks?: string;
  consumedBy?: string;
};

export interface RecipeConsumptionLine {
  materialId: string;
  productCode: string;
  materialName: string;
  stockUnit: string;
  quantity: number;
  unitCost: number;
  value: number;
  balanceAfter: number;
}

export interface RecipeConsumption {
  id: string;
  consumptionNo: string;
  recipeId: string;
  sourceType: "POS Sale" | "Manual";
  sourceRef: string;
  menuItemId: string | null;
  portions: number;
  warehouseId: string;
  totalCost: number;
  lines: RecipeConsumptionLine[];
  remarks: string;
  consumedBy: string;
  consumedAt: string;
}

export const YIELD_UNITS = ["Portions", "Plates", "Glasses", "Pieces", "Kg", "Litre"] as const;

const SINGULAR_YIELD: Record<string, string> = { Portions: "Portion", Plates: "Plate", Glasses: "Glass", Pieces: "Piece" };

/** "1 Portion" / "4 Portions"; pass no qty for the singular ("cost per Portion"). */
export function yieldUnitLabel(unit: string, qty = 1) {
  return qty === 1 ? (SINGULAR_YIELD[unit] ?? unit) : unit;
}

/** Food cost % above this is flagged. */
export const TARGET_FOOD_COST_PERCENT = 35;

type Dimension = "mass" | "volume" | "count";

const UNIT_ALIASES: Record<string, { dimension: Dimension; base: number }> = {
  mg: { dimension: "mass", base: 0.001 },
  milligram: { dimension: "mass", base: 0.001 },
  milligrams: { dimension: "mass", base: 0.001 },
  g: { dimension: "mass", base: 1 },
  gm: { dimension: "mass", base: 1 },
  gms: { dimension: "mass", base: 1 },
  gram: { dimension: "mass", base: 1 },
  grams: { dimension: "mass", base: 1 },
  kg: { dimension: "mass", base: 1000 },
  kgs: { dimension: "mass", base: 1000 },
  kilo: { dimension: "mass", base: 1000 },
  kilogram: { dimension: "mass", base: 1000 },
  kilograms: { dimension: "mass", base: 1000 },
  ml: { dimension: "volume", base: 1 },
  millilitre: { dimension: "volume", base: 1 },
  millilitres: { dimension: "volume", base: 1 },
  milliliter: { dimension: "volume", base: 1 },
  milliliters: { dimension: "volume", base: 1 },
  l: { dimension: "volume", base: 1000 },
  lt: { dimension: "volume", base: 1000 },
  ltr: { dimension: "volume", base: 1000 },
  ltrs: { dimension: "volume", base: 1000 },
  litre: { dimension: "volume", base: 1000 },
  litres: { dimension: "volume", base: 1000 },
  liter: { dimension: "volume", base: 1000 },
  liters: { dimension: "volume", base: 1000 },
  pc: { dimension: "count", base: 1 },
  pcs: { dimension: "count", base: 1 },
  piece: { dimension: "count", base: 1 },
  pieces: { dimension: "count", base: 1 },
  no: { dimension: "count", base: 1 },
  nos: { dimension: "count", base: 1 },
  unit: { dimension: "count", base: 1 },
  units: { dimension: "count", base: 1 },
  each: { dimension: "count", base: 1 },
  dozen: { dimension: "count", base: 12 },
  dz: { dimension: "count", base: 12 },
};

const RECIPE_UNITS: Record<Dimension, string[]> = {
  mass: ["g", "kg", "mg"],
  volume: ["ml", "L"],
  count: ["pcs", "dozen"],
};

const normalizeUnit = (unit: string) => unit.trim().toLowerCase().replace(/\.$/, "");

/** How many `toUnit` one `fromUnit` is; null when they measure different things. Mirrors the backend. */
export function unitConversionFactor(fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return null;
  if (from === to) return 1;
  const a = UNIT_ALIASES[from];
  const b = UNIT_ALIASES[to];
  if (!a || !b || a.dimension !== b.dimension) return null;
  return a.base / b.base;
}

/** Units a chef can write this material in: compatible metric units plus the stock unit itself. */
export function recipeUnitsFor(stockUnit: string): string[] {
  const dim = UNIT_ALIASES[normalizeUnit(stockUnit)]?.dimension;
  const options = dim ? RECIPE_UNITS[dim] : [];
  const hasStock = options.some((u) => normalizeUnit(u) === normalizeUnit(stockUnit));
  return hasStock ? options : [stockUnit, ...options];
}

/** Sensible default unit for a new line: grams / millilitres for bulk materials, else the stock unit. */
export function defaultRecipeUnit(stockUnit: string): string {
  const dim = UNIT_ALIASES[normalizeUnit(stockUnit)]?.dimension;
  if (dim === "mass") return "g";
  if (dim === "volume") return "ml";
  return stockUnit;
}

export function grossStockQuantity(stockQuantity: number, ingredientWastage: number, recipeWastage: number) {
  return stockQuantity * (1 + ingredientWastage / 100) * (1 + recipeWastage / 100);
}
