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
  fbCashierService,
  fbOrderService,
  fbReportService,
  fbReservationService,
  grnService,
  happyHourService,
  ingredientService,
  kdsService,
  kitchenPrinterService,
  menuCategoryService,
  menuItemService,
  modifierService,
  orderTypeService,
  outletService,
  paymentModeService,
  pricingService,
  purchaseOrderService,
  reasonMasterService,
  recipeService,
  serviceChargeService,
  stockAdjustmentService,
  stockCountService,
  stockMovementService,
  supplierService,
  tableService,
  tableTypeService,
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

type ReportSummary = {
  salesTotal?: number;
  salesLabel?: string;
  orderCount?: number;
  coversTotal?: number;
  outletCount?: number;
  rowCount?: number;
  growth?: string;
};

function reportTypeFromPath(path: string) {
  const m = path.match(/\/food-beverages\/reports\/([^/]+)/);
  return m?.[1] ?? null;
}

function parseDisplayMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!raw) return 0;
  if (raw.endsWith("L")) return (Number.parseFloat(raw) || 0) * 100_000;
  if (raw.endsWith("K")) return (Number.parseFloat(raw) || 0) * 1_000;
  return Number.parseFloat(raw) || 0;
}

function formatCompactInr(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 1 : 2)}L`;
  if (n >= 1_000) return `₹${Math.round(n).toLocaleString("en-IN")}`;
  return `₹${Math.round(n)}`;
}

function buildReportStats(
  path: string,
  rows: ModuleRow[],
  summary: ReportSummary | null,
  authored: FbPageDefinition["stats"],
): FbPageDefinition["stats"] {
  if (!path.includes("/reports/") || !authored.length) return authored;

  const sales =
    Number(summary?.salesTotal ?? 0) ||
    rows.reduce((s, r) => s + parseDisplayMoney(r.sales ?? r.amount ?? r.revenue), 0);
  const bills =
    Number(summary?.orderCount ?? 0) ||
    rows.reduce((s, r) => s + (Number(r.bills ?? r.qty ?? r.tickets ?? 0) || 0), 0);
  const covers =
    Number(summary?.coversTotal ?? 0) ||
    rows.reduce((s, r) => s + (Number(r.covers ?? 0) || 0), 0);
  const growth = String(summary?.growth ?? rows[0]?.growth ?? "—");

  return authored.map((stat) => {
    const label = stat.label.toLowerCase();
    if (
      label.includes("today") ||
      label.includes("mtd total") ||
      label.includes("revenue") ||
      label.includes("discount value") ||
      label.includes("on hand") ||
      label.includes("collected") ||
      label.includes("day sales")
    ) {
      return { ...stat, value: summary?.salesLabel ?? formatCompactInr(sales) };
    }
    if (
      label === "bills" ||
      label === "cancelled today" ||
      label === "items sold" ||
      label === "tickets"
    ) {
      return { ...stat, value: bills || rows.length };
    }
    if (label === "covers") {
      return { ...stat, value: covers };
    }
    if (label.includes("vs yesterday") || label === "growth") {
      return { ...stat, value: growth };
    }
    if (label === "outlets" || label === "categories" || label === "unique skus") {
      return {
        ...stat,
        value: Number(summary?.outletCount ?? rows.length) || rows.length,
      };
    }
    if (
      label === "top outlet" ||
      label === "top item" ||
      label === "top category" ||
      label === "top reason"
    ) {
      const top =
        rows[0]?.outlet ??
        rows[0]?.item ??
        rows[0]?.category ??
        rows[0]?.reason ??
        rows[0]?.kitchen ??
        "—";
      return { ...stat, value: String(top) };
    }
    if (label === "variance" && rows.some((r) => r.variance !== undefined)) {
      return { ...stat, value: String(rows[0]?.variance ?? "—") };
    }
    return {
      ...stat,
      value: rows.length ? (typeof stat.value === "string" ? String(rows.length) : rows.length) : typeof stat.value === "number" ? 0 : "—",
    };
  });
}

const readOnlyReport = (type: string): CrudLike => ({
  list: async () => {
    const data = await fbReportService.get(type);
    return (data.rows ?? []) as Record<string, unknown>[];
  },
  create: async () => {
    throw new Error("Reports are read-only");
  },
  update: async () => {
    throw new Error("Reports are read-only");
  },
  remove: async () => {
    throw new Error("Reports are read-only");
  },
});

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
  "/food-beverages/banquet/close-event": banquetBillingService as CrudLike,
  "/food-beverages/restaurants/cashier": {
    list: async () =>
      (await fbCashierService.list()) as unknown as Record<string, unknown>[],
    create: async (body) =>
      (await fbCashierService.open(body as never)) as unknown as Record<
        string,
        unknown
      >,
    update: async (id, body) =>
      (await fbCashierService.update(id, body as never)) as unknown as Record<
        string,
        unknown
      >,
    remove: async () => {
      /* shifts are closed, not deleted */
    },
  },
  "/food-beverages/bar/orders": {
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
  "/food-beverages/kitchen/kds": {
    list: async () =>
      (await kdsService.list()) as unknown as Record<string, unknown>[],
    create: async (body) =>
      (await kdsService.create(body as never)) as unknown as Record<
        string,
        unknown
      >,
    update: async (id, body) =>
      (await kdsService.update(id, body as never)) as unknown as Record<
        string,
        unknown
      >,
    remove: async () => {
      /* KDS tickets are advanced, not deleted */
    },
  },
  "/food-beverages/kitchen/orders": {
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
  "/food-beverages/kitchen/preparation-queue": {
    list: async () =>
      (await kdsService.list()) as unknown as Record<string, unknown>[],
    create: async (body) =>
      (await kdsService.create(body as never)) as unknown as Record<
        string,
        unknown
      >,
    update: async (id, body) =>
      (await kdsService.update(id, body as never)) as unknown as Record<
        string,
        unknown
      >,
    remove: async () => {},
  },
  "/food-beverages/menu/categories": menuCategoryService as CrudLike,
  "/food-beverages/menu/items": menuItemService as CrudLike,
  "/food-beverages/menu/modifiers": modifierService as CrudLike,
  "/food-beverages/menu/combos": comboService as CrudLike,
  "/food-beverages/menu/pricing": pricingService as CrudLike,
  "/food-beverages/menu/recipes": recipeService as CrudLike,
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
  "/food-beverages/settings/service-charge": serviceChargeService as CrudLike,
  "/food-beverages/settings/kitchen-printers": kitchenPrinterService as CrudLike,
  "/food-beverages/settings/modifiers": modifierService as CrudLike,
  "/food-beverages/settings/table-types": tableTypeService as CrudLike,
  "/food-beverages/settings/reason-masters": reasonMasterService as CrudLike,
  "/food-beverages/reports/daily-sales": readOnlyReport("daily-sales"),
  "/food-beverages/reports/item-sales": readOnlyReport("item-sales"),
  "/food-beverages/reports/category-sales": readOnlyReport("category-sales"),
  "/food-beverages/reports/outlet-sales": readOnlyReport("outlet-sales"),
  "/food-beverages/reports/cashier": readOnlyReport("cashier"),
  "/food-beverages/reports/table-turnover": readOnlyReport("table-turnover"),
  "/food-beverages/reports/food-cost": readOnlyReport("food-cost"),
  "/food-beverages/reports/inventory": readOnlyReport("inventory"),
  "/food-beverages/reports/kitchen-performance": readOnlyReport("kitchen-performance"),
  "/food-beverages/reports/cancelled-bills": readOnlyReport("cancelled-bills"),
  "/food-beverages/reports/discount": readOnlyReport("discount"),
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

  // Close Event reuses banquet billing; align status labels for the UI
  if (path.includes("/banquet/close-event")) {
    if (String(base.status).toLowerCase() === "settled") {
      base.status = "Closed";
    }
    if (!base.venue && base.event) {
      // keep list usable when venue column is absent in billing rows
      base.venue = String(base.venue ?? "—");
    }
  }

  // Outlets: keep operational status separate from booking availability
  if (path.includes("/outlets") || path.includes("/banquet/venues")) {
    const bookingValues = new Set(["available", "occupied", "booked", "reserved"]);
    const statusVal = String(base.status ?? "").trim();
    if (bookingValues.has(statusVal.toLowerCase()) && !base.bookingStatus) {
      const lower = statusVal.toLowerCase();
      base.bookingStatus =
        lower === "available" ? "Available" : "Booked";
      base.status = "Active";
    }
    const booking = String(base.bookingStatus ?? "").toLowerCase();
    if (booking === "occupied" || booking === "reserved") {
      base.bookingStatus = "Booked";
    }
    if (!base.bookingStatus) base.bookingStatus = "Available";
    if (!base.status) base.status = "Active";
    // Drop sales/covers from list UI payloads
    delete base.sales;
    delete base.covers;
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
  if (path.includes("/outlets")) {
    delete payload.sales;
    delete payload.covers;
  }
  if (path.includes("/banquet/close-event")) {
    if (String(payload.status).toLowerCase() === "closed") {
      // Persist as Closed; billing also accepts Settled historically
      payload.status = "Closed";
    }
  }
  return payload;
}

function toModuleDefinition(
  definition: FbPageDefinition,
  rows: ModuleRow[],
  outlets: FbOutlet[],
  path: string,
  reportSummary: ReportSummary | null,
  crud?: ModuleCrudHandlers,
  tableInventory?: ModuleRow[],
  tableCrud?: ModuleCrudHandlers,
): ModuleListDefinition {
  const types = scopeTypes(definition.outletScope);
  const scoped = (() => {
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

  const calculatedStats = path.includes("/reports/")
    ? buildReportStats(path, rows, reportSummary, definition.stats)
    : definition.stats.map((stat) => {
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
          const totalTables = rows.reduce(
            (sum, r) => sum + (Number(r.tables) || 0),
            0,
          );
          return { ...stat, value: totalTables };
        }
        if (stat.label === "Covers Today" || stat.label === "Covers") {
          const totalCovers = rows.reduce(
            (sum, r) => sum + (Number(r.covers) || 0),
            0,
          );
          return { ...stat, value: totalCovers };
        }
        return stat;
      });

  return {
    title: definition.title,
    description: definition.description,
    eyebrow: scoped.length ? undefined : "Food & Beverages",
    stats: calculatedStats,
    columns: definition.columns.map((col) => {
      if (col.key !== "outletId") return col;
      return {
        ...col,
        inputType: "select" as const,
        options: scoped.map((o) => ({ value: o.id, label: o.name })),
        render: (row: ModuleRow) => {
          const match = scoped.find((o) => o.id === row.outletId);
          return match?.name ?? String(row.outletId ?? "—");
        },
      };
    }),
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
    tableInventory,
    tableCrud,
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
  const [tableInventory, setTableInventory] = useState<ModuleRow[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const needsTableOps = (definition.secondaryActions ?? []).some((a) =>
    /merge|split/i.test(a),
  );
  const reportType = reportTypeFromPath(path);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!service && !reportType) {
        if (!cancelled) {
          setRows([]);
          setReportSummary(null);
          setError("This page is not connected to the API yet.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        if (reportType) {
          const data = await fbReportService.get(reportType);
          if (!cancelled) {
            setRows(
              (data.rows ?? []).map((row) =>
                normalizeRow(path, row as Record<string, unknown>),
              ),
            );
            setReportSummary((data.summary ?? null) as ReportSummary | null);
            setError(null);
          }
        } else if (service) {
          const data = await service.list();
          if (!cancelled) {
            let mapped = data.map((row) => normalizeRow(path, row));
            if (path.includes("/banquet/venues")) {
              mapped = mapped.filter(
                (r) => String(r.type).toLowerCase() === "banquet",
              );
            }
            setRows(mapped);
            setReportSummary(null);
            setError(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setReportSummary(null);
          setError(e instanceof Error ? e.message : "Failed to load from API");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, service, reportType]);

  useEffect(() => {
    if (!needsTableOps || path.includes("/tables")) {
      setTableInventory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await tableService.list();
        if (!cancelled) {
          setTableInventory(data.map((row) => normalizeRow("/food-beverages/restaurants/tables", row)));
        }
      } catch {
        if (!cancelled) setTableInventory([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsTableOps, path]);

  const crud = useMemo<ModuleCrudHandlers | undefined>(() => {
    if (!service) return undefined;
    // Reports are read-only list views
    if (path.includes("/reports/")) return undefined;
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

  const tableCrud = useMemo<ModuleCrudHandlers | undefined>(() => {
    if (!needsTableOps) return undefined;
    return {
      create: async (row) => {
        const saved = await tableService.create(toApiPayload("/food-beverages/restaurants/tables", row));
        const normalized = normalizeRow("/food-beverages/restaurants/tables", saved);
        setTableInventory((prev) => [normalized, ...prev]);
        return normalized;
      },
      update: async (id, row) => {
        const saved = await tableService.update(
          id,
          toApiPayload("/food-beverages/restaurants/tables", row as ModuleRow),
        );
        const normalized = normalizeRow("/food-beverages/restaurants/tables", saved);
        setTableInventory((prev) => prev.map((r) => (r.id === id ? normalized : r)));
        return normalized;
      },
      remove: async (id) => {
        await tableService.remove(id);
        setTableInventory((prev) => prev.filter((r) => r.id !== id));
      },
    };
  }, [needsTableOps]);

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
      definition={toModuleDefinition(
        definition,
        rows,
        outlets,
        path,
        reportSummary,
        crud,
        needsTableOps && !path.includes("/tables") ? tableInventory : undefined,
        needsTableOps && !path.includes("/tables") ? tableCrud : undefined,
      )}
    />
  );
}
