export type ConversionStatus = "Draft" | "Completed" | "Cancelled";

export type ConversionLine = {
  id: string;
  conversionId?: string;
  lineNo: number;
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  qty: number;
  uom: string;
};

/** Stock / production batch — produces qty from a conversion item master. */
export type Conversion = {
  id: string;
  conversionNo: string;
  conversionDate: string;
  conversionItemId: string;
  outputIngredientId: string;
  outputName: string;
  outputQty: number;
  outputUom: string;
  notes: string;
  status: ConversionStatus;
  completedAt: string | null;
  completedBy: string;
  lines: ConversionLine[];
  createdAt: string;
  updatedAt: string;
};

export type ConversionLineInput = {
  ingredientId: string;
  qty: number;
  uom?: string;
};

export type ConversionInput = {
  conversionItemId: string;
  conversionDate?: string;
  /** Quantity of prepared item to produce (scaled from master yield). */
  outputQty: number;
  notes?: string;
};

export type ConversionItemLine = {
  id: string;
  conversionItemId?: string;
  lineNo: number;
  ingredientId: string;
  ingredientCode: string;
  ingredientName: string;
  qty: number;
  uom: string;
};

/** Master BOM — defines how a prepared item is made. Does not move stock. */
export type ConversionItem = {
  id: string;
  code: string;
  name: string;
  outputIngredientId: string;
  /** Linked Purchase & Stores product — used in recipes and POS deduction. */
  psProductId: string;
  outputName: string;
  yieldQty: number;
  yieldUom: string;
  notes: string;
  status: "Active" | "Inactive";
  lines: ConversionItemLine[];
  createdAt: string;
  updatedAt: string;
};

export type ConversionItemInput = {
  name: string;
  code?: string;
  yieldQty: number;
  yieldUom?: string;
  notes?: string;
  status?: "Active" | "Inactive";
  outputIngredientId?: string;
  lines: ConversionLineInput[];
};

export type FbIngredient = {
  id: string;
  code?: string;
  name: string;
  uom?: string;
  onHand?: number;
  reorder?: number;
  kind?: "raw" | "prepared" | string;
  status?: string;
};
