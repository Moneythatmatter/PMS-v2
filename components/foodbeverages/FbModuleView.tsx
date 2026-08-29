"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { FbPageDefinition } from "@/app/data/foodbeverages/modules";
import type { ModuleCrudHandlers, ModuleListDefinition, ModuleRow } from "@/components/pms";
import { ModuleListPage } from "@/components/pms";
import {
  dayCloseService,
  fbCashierService,
  fbOrderService,
  fbReportService,
  fbReservationService,
  fbModifierGroupService,
  fbOutletTypeService,
  fbTaxGroupService,
  fbUnitService,
  ingredientService,
  menuCategoryService,
  menuItemService,
  modifierService,
  outletService,
  recipeService,
  stockAdjustmentService,
  tableService,
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

type ItemLookupOption = { id: string; name: string };

type ItemLookups = {
  categories: ItemLookupOption[];
  taxGroups: ItemLookupOption[];
};

const ITEM_FK_COLUMNS: Record<string, keyof ItemLookups> = {
  categoryId: "categories",
  taxGroupId: "taxGroups",
};

function mapLookupRows(rows: Record<string, unknown>[]): ItemLookupOption[] {
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    name: String(row.name ?? row.code ?? row.id ?? "—"),
  }));
}

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
  "/food-beverages/restaurants/day-close": dayCloseService as CrudLike,
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
  "/food-beverages/kitchen/orders": {
    list: async () => {
      const rows = await fbOrderService.list();
      return rows.map((o) => {
        const lines = Array.isArray(o.lines) ? o.lines : [];
        const itemCount = lines.reduce((n, l) => n + Number(l.qty ?? 0), 0);
        const itemsSummary =
          lines.length === 0
            ? "—"
            : lines
                .slice(0, 3)
                .map((l) => `${l.name} ×${l.qty}`)
                .join(", ") + (lines.length > 3 ? ` +${lines.length - 3}` : "");
        const sourceParts = [o.type, o.ref].filter(Boolean);
        return {
          ...o,
          source: sourceParts.length ? sourceParts.join(" · ") : "—",
          items: itemCount > 0 ? itemsSummary : "—",
          priority: "Normal",
          time: o.placedAt || "—",
        } as unknown as Record<string, unknown>;
      });
    },
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
  "/food-beverages/masters/units": fbUnitService as CrudLike,
  "/food-beverages/masters/tax-groups": fbTaxGroupService as CrudLike,
  "/food-beverages/masters/modifier-groups": fbModifierGroupService as CrudLike,
  "/food-beverages/masters/outlet-types": fbOutletTypeService as CrudLike,
  "/food-beverages/menu/categories": menuCategoryService as CrudLike,
  "/food-beverages/menu/items": menuItemService as CrudLike,
  "/food-beverages/menu/modifiers": modifierService as CrudLike,
  "/food-beverages/menu/recipes": recipeService as CrudLike,
  "/food-beverages/inventory/ingredients": ingredientService as CrudLike,
  "/food-beverages/inventory/wastage": wastageService as CrudLike,
  "/food-beverages/inventory/adjustments": stockAdjustmentService as CrudLike,
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
): ("restaurant" | "cafe" | "kitchen" | "all")[] {
  if (scope === "restaurant") return ["restaurant", "cafe"];
  if (scope === "kitchen") return ["kitchen"];
  return ["all"];
}

function titleCaseType(value: unknown) {
  const s = String(value ?? "");
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeRow(path: string, row: Record<string, unknown>): ModuleRow {
  const rawOutlet = row.outletId ?? row.venueId;
  const base: ModuleRow = {
    id: String(row.id ?? ""),
    status: row.status !== undefined ? String(row.status) : undefined,
    outletId: rawOutlet !== undefined && rawOutlet !== null ? String(rawOutlet) : undefined,
    venueId: row.venueId !== undefined && row.venueId !== null ? String(row.venueId) : undefined,
  };

  for (const [key, value] of Object.entries(row)) {
    if (key === "id" || key === "status" || key === "outletId" || key === "venueId") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    if (
      (key === "amount" || key === "sales" || key === "revenue" || key === "rate" || key === "price" || key === "balance") &&
      typeof value === "number"
    ) {
      base[key] = `₹${value.toLocaleString("en-IN")}`;
    } else {
      base[key] = value as string | number;
    }
  }

  if (path.includes("/outlets") && base.type) {
    base.type = titleCaseType(base.type);
  }

  // Outlets: keep operational status separate from booking availability
  if (path.includes("/outlets")) {
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

  for (const [key, value] of Object.entries(payload)) {
    if (
      typeof value === "string" &&
      (value.includes("₹") ||
        ["amount", "price", "rate", "cost", "balance", "sales", "revenue", "total", "tax", "discount"].includes(key))
    ) {
      const cleaned = value.replace(/₹/g, "").replace(/,/g, "").replace(/\s/g, "").trim();
      const num = Number(cleaned);
      if (Number.isFinite(num) && cleaned !== "") {
        payload[key] = num;
      }
    }
  }

  if (path.includes("/outlets") && payload.type) {
    payload.type = String(payload.type).toLowerCase();
  }
  if (path.includes("/outlets")) {
    delete payload.sales;
    delete payload.covers;
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
  itemLookups?: ItemLookups,
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
      const fkLookupKey = ITEM_FK_COLUMNS[col.key];
      if (fkLookupKey && itemLookups) {
        const options = itemLookups[fkLookupKey].map((o) => ({
          value: o.id,
          label: o.name,
        }));
        return {
          ...col,
          inputType: "select" as const,
          options,
          render: (row: ModuleRow) => {
            const val = row[col.key];
            if (val === undefined || val === null || val === "") return "—";
            const match = itemLookups[fkLookupKey].find((o) => o.id === String(val));
            return match?.name ?? String(val);
          },
        };
      }
      if (col.key !== "outletId" && col.key !== "venueId") return col;
      return {
        ...col,
        inputType: "select" as const,
        options: scoped.map((o) => ({ value: o.id, label: o.name })),
        render: (row: ModuleRow) => {
          const val = row.outletId ?? row.venueId;
          const match = scoped.find((o) => o.id === val);
          return match?.name ?? (val !== undefined && val !== null ? String(val) : "—");
        },
      };
    }),
    rows,
    searchPlaceholder: definition.searchPlaceholder,
    filterOptions: definition.filterOptions,
    filterKeys: definition.filterKeys,
    actionLabel: definition.actionLabel,
    secondaryActions: definition.secondaryActions,
    statusStyle: definition.statusStyle,
    outlets: scoped.length ? scoped : undefined,
    outletLabel:
      definition.outletScope === "kitchen"
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
  const [itemLookups, setItemLookups] = useState<ItemLookups | null>(null);
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
            if (path.includes("/menu/items")) {
              try {
                const [categories, taxGroups] = await Promise.all([
                  menuCategoryService.list(),
                  fbTaxGroupService.list(),
                ]);
                if (!cancelled) {
                  setItemLookups({
                    categories: mapLookupRows(
                      (categories ?? []) as Record<string, unknown>[],
                    ),
                    taxGroups: mapLookupRows(
                      (taxGroups ?? []) as Record<string, unknown>[],
                    ),
                  });
                }
              } catch {
                if (!cancelled) {
                  setItemLookups({
                    categories: [],
                    taxGroups: [],
                  });
                }
              }
            } else if (!cancelled) {
              setItemLookups(null);
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
        itemLookups ?? undefined,
      )}
    />
  );
}
