"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { FbPageDefinition } from "@/app/data/foodbeverages/modules";
import type { ModuleCrudHandlers, ModuleListDefinition, ModuleRow } from "@/components/pms";
import { ModuleListPage } from "@/components/pms";
import {
  banquetBillingService,
  banquetBookingService,
  banquetPackageService,
  banquetRequirementService,
  barStockService,
  bottleService,
  cocktailService,
  comboService,
  dayCloseService,
  discountService,
  drinkCategoryService,
  drinkService,
  fbOrderService,
  fbReservationService,
  grnService,
  happyHourService,
  ingredientService,
  menuCategoryService,
  menuItemService,
  modifierService,
  orderTypeService,
  outletService,
  paymentModeService,
  pricingService,
  purchaseOrderService,
  stockAdjustmentService,
  stockCountService,
  stockMovementService,
  supplierService,
  tableService,
  taxService,
  wastageService,
  type FbOutlet,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

type CrudLike = {
  list: (query?: string) => Promise<Record<string, unknown>[]>;
  create: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
  update: (id: string, body: Record<string, unknown>) => Promise<Record<string, unknown>>;
  remove: (id: string) => Promise<unknown>;
};

const PATH_SERVICE: Record<string, CrudLike> = {
  "/food-beverages/restaurants/outlets": outletService as CrudLike,
  "/food-beverages/restaurants/tables": tableService as CrudLike,
  "/food-beverages/restaurants/reservations": fbReservationService as CrudLike,
  "/food-beverages/restaurants/orders": {
    list: async () =>
      (await fbOrderService.list()) as unknown as Record<string, unknown>[],
    create: async (body) =>
      (await fbOrderService.create({
        ...body,
        lines: Array.isArray(body.lines) ? body.lines : [],
      } as never)) as unknown as Record<string, unknown>,
    update: async (id, body) =>
      (await fbOrderService.update(id, body as never)) as unknown as Record<
        string,
        unknown
      >,
    remove: (id) => fbOrderService.remove(id),
  },
  "/food-beverages/restaurants/day-close": dayCloseService as CrudLike,
  "/food-beverages/banquet/venues": outletService as CrudLike,
  "/food-beverages/banquet/bookings": banquetBookingService as CrudLike,
  "/food-beverages/banquet/menu-packages": banquetPackageService as CrudLike,
  "/food-beverages/banquet/requirements": banquetRequirementService as CrudLike,
  "/food-beverages/banquet/billing": banquetBillingService as CrudLike,
  "/food-beverages/menu/categories": menuCategoryService as CrudLike,
  "/food-beverages/menu/items": menuItemService as CrudLike,
  "/food-beverages/menu/modifiers": modifierService as CrudLike,
  "/food-beverages/menu/combos": comboService as CrudLike,
  "/food-beverages/menu/pricing": pricingService as CrudLike,
  "/food-beverages/inventory/ingredients": ingredientService as CrudLike,
  "/food-beverages/inventory/suppliers": supplierService as CrudLike,
  "/food-beverages/inventory/purchase-orders": purchaseOrderService as CrudLike,
  "/food-beverages/inventory/grn": grnService as CrudLike,
  "/food-beverages/inventory/stock-movement": stockMovementService as CrudLike,
  "/food-beverages/inventory/wastage": wastageService as CrudLike,
  "/food-beverages/inventory/stock-count": stockCountService as CrudLike,
  "/food-beverages/inventory/adjustments": stockAdjustmentService as CrudLike,
  "/food-beverages/bar/drink-categories": drinkCategoryService as CrudLike,
  "/food-beverages/bar/drinks": drinkService as CrudLike,
  "/food-beverages/bar/cocktails": cocktailService as CrudLike,
  "/food-beverages/bar/happy-hour": happyHourService as CrudLike,
  "/food-beverages/bar/stock": barStockService as CrudLike,
  "/food-beverages/bar/bottle-tracking": bottleService as CrudLike,
  "/food-beverages/settings/taxes": taxService as CrudLike,
  "/food-beverages/settings/discounts": discountService as CrudLike,
  "/food-beverages/settings/payment-modes": paymentModeService as CrudLike,
  "/food-beverages/settings/order-types": orderTypeService as CrudLike,
};

function scopeTypes(
  scope: FbPageDefinition["outletScope"],
): ("restaurant" | "cafe" | "kitchen" | "banquet" | "bar" | "all")[] {
  if (scope === "restaurant") return ["restaurant", "cafe"];
  if (scope === "kitchen") return ["kitchen"];
  if (scope === "banquet") return ["banquet"];
  if (scope === "bar") return ["bar"];
  return ["all"];
}

function titleCaseType(value: unknown) {
  const s = String(value ?? "");
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeRow(path: string, row: Record<string, unknown>): ModuleRow {
  const base: ModuleRow = {
    id: String(row.id ?? ""),
    status: row.status !== undefined ? String(row.status) : undefined,
    outletId: row.outletId !== undefined ? String(row.outletId) : undefined,
  };

  for (const [key, value] of Object.entries(row)) {
    if (key === "id" || key === "status" || key === "outletId") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    base[key] = value as string | number;
  }

  if (path.includes("/outlets") && base.type) {
    base.type = titleCaseType(base.type);
  }
  if (path.includes("/banquet/venues") && base.type) {
    base.type = titleCaseType(base.type);
  }

  return base;
}

function toApiPayload(path: string, row: ModuleRow): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...row };
  if (
    (path.includes("/outlets") || path.includes("/banquet/venues")) &&
    payload.type
  ) {
    payload.type = String(payload.type).toLowerCase();
  }
  return payload;
}

function toModuleDefinition(
  definition: FbPageDefinition,
  rows: ModuleRow[],
  outlets: FbOutlet[],
  crud?: ModuleCrudHandlers,
): ModuleListDefinition {
  const scoped = (() => {
    const types = scopeTypes(definition.outletScope);
    if (types.includes("all") || definition.outletScope === "none") return [];
    return outlets
      .filter((o) => types.includes(o.type as (typeof types)[number]))
      .slice()
      .sort((a, b) => {
        const rank = (t: string) =>
          t === "restaurant" ? 0 : t === "cafe" ? 1 : 2;
        return rank(a.type) - rank(b.type) || a.name.localeCompare(b.name);
      })
      .map((o) => ({ id: o.id, name: o.name }));
  })();

  const calculatedStats = definition.stats.map((stat) => {
    if (stat.label === "Outlets" || stat.label === "Venues") {
      return { ...stat, value: rows.length };
    }
    if (stat.label === "Active") {
      const activeCount = rows.filter(
        (r) =>
          String(r.status ?? "").toLowerCase() === "active" ||
          String(r.status ?? "").toLowerCase() === "open",
      ).length;
      return { ...stat, value: activeCount };
    }
    if (stat.label === "Tables") {
      const totalTables = rows.reduce((sum, r) => sum + (Number(r.tables) || 0), 0);
      return { ...stat, value: totalTables };
    }
    if (stat.label === "Covers Today" || stat.label === "Covers") {
      const totalCovers = rows.reduce((sum, r) => sum + (Number(r.covers) || 0), 0);
      return { ...stat, value: totalCovers };
    }
    return { ...stat, value: rows.length };
  });

  return {
    title: definition.title,
    description: definition.description,
    eyebrow: scoped.length ? undefined : "Food & Beverages",
    stats: calculatedStats,
    columns: definition.columns,
    rows,
    searchPlaceholder: definition.searchPlaceholder,
    filterOptions: definition.filterOptions,
    actionLabel: definition.actionLabel,
    secondaryActions: definition.secondaryActions,
    statusStyle: definition.statusStyle,
    outlets: scoped.length ? scoped : undefined,
    outletLabel:
      definition.outletScope === "banquet"
        ? "Venue"
        : definition.outletScope === "kitchen"
          ? "Kitchen"
          : "Outlet",
    crud,
  };
}

/** F&B list pages — API data only (no mock seed fallback). */
export function FbModuleView({
  definition,
  path: pathProp,
}: {
  definition: FbPageDefinition;
  path?: string;
}) {
  const pathname = usePathname();
  const path = pathProp ?? pathname;
  const service = PATH_SERVICE[path];
  const { outlets } = useFbOutlets(scopeTypes(definition.outletScope));

  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!service) {
        if (!cancelled) {
          setRows([]);
          setError("This page is not connected to the API yet.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await service.list();
        if (!cancelled) {
          let mapped = data.map((row) => normalizeRow(path, row));
          if (path.includes("/banquet/venues")) {
            mapped = mapped.filter((r) => String(r.type).toLowerCase() === "banquet");
          }
          setRows(mapped);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Failed to load from API");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, service]);

  const crud = useMemo<ModuleCrudHandlers | undefined>(() => {
    if (!service) return undefined;
    return {
      create: async (row) => {
        const saved = await service.create(toApiPayload(path, row));
        const normalized = normalizeRow(path, saved);
        setRows((prev) => [normalized, ...prev]);
        return normalized;
      },
      update: async (id, row) => {
        const saved = await service.update(id, toApiPayload(path, row as ModuleRow));
        const normalized = normalizeRow(path, saved);
        setRows((prev) => prev.map((r) => (r.id === id ? normalized : r)));
        return normalized;
      },
      remove: async (id) => {
        await service.remove(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
      },
    };
  }, [path, service]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        <p className="font-semibold">Could not load data from API</p>
        <p className="mt-1 text-red-600">{error}</p>
        <p className="mt-3 text-xs text-red-500">
          Ensure the backend is running on port 5001 and the F&B schema is applied in
          Supabase.
        </p>
      </div>
    );
  }

  return (
    <ModuleListPage
      definition={toModuleDefinition(definition, rows, outlets, crud)}
    />
  );
}
