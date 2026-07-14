"use client";

import type { FbPageDefinition } from "@/app/data/foodbeverages/modules";
import {
  getOutletsForScope,
} from "@/app/data/foodbeverages/modules";
import type { ModuleListDefinition } from "@/components/pms";
import { ModuleListPage } from "@/components/pms";

function toModuleDefinition(definition: FbPageDefinition): ModuleListDefinition {
  const outlets = getOutletsForScope(definition.outletScope).map((o) => ({
    id: o.id,
    name: o.name,
  }));

  return {
    title: definition.title,
    description: definition.description,
    eyebrow: outlets.length ? undefined : "Food & Beverages",
    stats: definition.stats,
    columns: definition.columns,
    rows: definition.rows,
    searchPlaceholder: definition.searchPlaceholder,
    filterOptions: definition.filterOptions,
    actionLabel: definition.actionLabel,
    secondaryActions: definition.secondaryActions,
    statusStyle: definition.statusStyle,
    outlets: outlets.length ? outlets : undefined,
    outletLabel: definition.outletScope === "banquet" ? "Venue" : definition.outletScope === "kitchen" ? "Kitchen" : "Outlet",
  };
}

/** Thin adapter — F&B pages use the shared ModuleListPage kit. */
export function FbModuleView({ definition }: { definition: FbPageDefinition }) {
  return <ModuleListPage definition={toModuleDefinition(definition)} />;
}
