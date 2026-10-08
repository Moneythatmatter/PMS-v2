export type ModifierSelectionType = "single" | "multiple";

export type ModifierOption = {
  id: string;
  groupId: string;
  code: string;
  name: string;
  price: number;
  isDefault: boolean;
  sortOrder: number;
  status: "Active" | "Inactive";
};

export type ModifierGroup = {
  id: string;
  code: string;
  name: string;
  description: string;
  selectionType: ModifierSelectionType;
  isRequired: boolean;
  minSelect: number;
  /** null = no upper limit */
  maxSelect: number | null;
  sortOrder: number;
  status: "Active" | "Inactive";
  options: ModifierOption[];
  menuItemIds: string[];
  createdAt?: string;
};

export type ModifierGroupInput = {
  code?: string;
  name?: string;
  description?: string;
  selectionType?: ModifierSelectionType;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number | null;
  status?: "Active" | "Inactive";
  options?: Array<{
    id?: string;
    code?: string;
    name: string;
    price: number;
    isDefault?: boolean;
    status?: "Active" | "Inactive";
  }>;
  menuItemIds?: string[];
};

/** What the order line remembers about each chosen option. */
export type SelectedModifier = {
  groupId: string;
  groupName: string;
  modifierId: string;
  name: string;
  price: number;
};

type Rules = Pick<ModifierGroup, "selectionType" | "isRequired" | "minSelect" | "maxSelect">;

/** Effective limits after applying required/optional and single/multiple. */
export function selectionLimits(group: Rules) {
  if (group.selectionType === "single") return { min: group.isRequired ? 1 : 0, max: 1 as number | null };
  return { min: group.isRequired ? Math.max(1, group.minSelect) : 0, max: group.maxSelect };
}

export function ruleText(group: Rules) {
  const { min, max } = selectionLimits(group);
  if (group.selectionType === "single") return group.isRequired ? "Choose 1" : "Choose up to 1";
  if (max === null) return min > 0 ? `Choose at least ${min}` : "Choose any";
  if (min === max) return `Choose ${min}`;
  return min > 0 ? `Choose ${min}–${max}` : `Choose up to ${max}`;
}

/** Problem with the current picks for one group, or null when they satisfy the rules. */
export function groupSelectionError(group: Rules, count: number) {
  const { min, max } = selectionLimits(group);
  if (count < min) return min === 1 ? "Pick one option" : `Pick at least ${min}`;
  if (max !== null && count > max) return `Pick at most ${max}`;
  return null;
}

/** Groups that apply to a menu item: active, linked to it, with at least one active option. */
export function groupsForItem(groups: ModifierGroup[], menuItemId: string) {
  return groups
    .filter((g) => g.status === "Active" && g.menuItemIds.includes(menuItemId))
    .map((g) => ({ ...g, options: g.options.filter((o) => o.status === "Active") }))
    .filter((g) => g.options.length > 0);
}

export function modifierSummary(modifiers: Array<Pick<SelectedModifier, "name">>) {
  return modifiers.map((m) => m.name).join(", ");
}
