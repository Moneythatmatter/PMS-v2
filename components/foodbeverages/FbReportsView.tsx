"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Clock,
  IndianRupee,
  Percent,
  Receipt,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { fbPageDefinitions, type FbPageDefinition } from "@/app/data/foodbeverages/modules";
import type { ReportChartConfig, ReportRow } from "@/app/data/frontoffice/reports";
import { formatINR } from "@/app/data/foodbeverages/ops";
import type { ModuleRow } from "@/components/pms";
import {
  ReportWorkspace,
  WorkspaceFilterSelect,
  exportReportXlsx,
  useQuickDateRange,
} from "@/components/reports/ReportWorkspace";
import { fbReportService, type FbOutlet } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

function reportTypeFromPath(path: string) {
  const m = path.match(/\/food-beverages\/reports\/([^/]+)/);
  return m?.[1] ?? "daily-sales";
}

function parseMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!raw || raw === "—") return 0;
  if (raw.endsWith("L")) return (Number.parseFloat(raw) || 0) * 100_000;
  if (raw.endsWith("K")) return (Number.parseFloat(raw) || 0) * 1_000;
  return Number.parseFloat(raw) || 0;
}

function formatCompactInr(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 1 : 2)}L`;
  return formatINR(n);
}

function moneyOf(
  row: ModuleRow,
  keys: string[] = ["salesValue", "sales", "amount", "revenue", "gross", "value", "cost"],
) {
  for (const key of keys) {
    if (row[key] === undefined) continue;
    if (key === "salesValue") {
      const n = Number(row.salesValue);
      if (Number.isFinite(n)) return n;
    }
    const parsed = parseMoney(row[key]);
    if (parsed) return parsed;
  }
  return 0;
}

function buildCharts(type: string, rows: ModuleRow[]): ReportChartConfig[] {
  if (!rows.length) return [];

  if (type === "daily-sales") {
    return [
      {
        title: "Sales trend",
        subtitle: "Gross sales by day",
        type: "area",
        data: rows.map((r) => ({
          name: String(r.date ?? r.id),
          value: moneyOf(r),
        })),
        valueFormat: "currency",
      },
      {
        title: "Bills by day",
        subtitle: "Settled bill count",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.date ?? r.id),
          value: Number(r.bills ?? 0),
        })),
        valueFormat: "number",
      },
    ];
  }

  if (type === "outlet-sales" || type === "food-cost") {
    return [
      {
        title: type === "food-cost" ? "Cost by outlet" : "Sales by outlet",
        subtitle: type === "food-cost" ? "Estimated food cost" : "Gross sales",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.outlet ?? r.id),
          value: moneyOf(
            r,
            type === "food-cost"
              ? ["cost", "salesValue", "sales"]
              : ["salesValue", "sales"],
          ),
        })),
        valueFormat: "currency",
        layout: "horizontal",
      },
      {
        title: "Share",
        subtitle: "Mix across outlets",
        type: "pie",
        data: rows.map((r) => ({
          name: String(r.outlet ?? r.id),
          value: moneyOf(r),
        })),
        valueFormat: "currency",
      },
    ];
  }

  if (type === "item-sales" || type === "category-sales") {
    const labelKey = type === "item-sales" ? "item" : "category";
    return [
      {
        title: type === "item-sales" ? "Top items" : "Category mix",
        subtitle: "Sales contribution",
        type: type === "category-sales" ? "pie" : "bar",
        data: rows.slice(0, 8).map((r) => ({
          name: String(r[labelKey] ?? r.id),
          value: moneyOf(r),
        })),
        valueFormat: "currency",
        layout: type === "item-sales" ? "horizontal" : "vertical",
      },
      {
        title: "Quantity",
        subtitle: "Units sold",
        type: "bar",
        data: rows.slice(0, 8).map((r) => ({
          name: String(r[labelKey] ?? r.id),
          value: Number(r.qty ?? 0),
        })),
        valueFormat: "number",
      },
    ];
  }

  if (type === "cashier") {
    return [
      {
        title: "Collections by cashier",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.cashier ?? r.id),
          value: moneyOf(r),
        })),
        valueFormat: "currency",
        layout: "horizontal",
      },
    ];
  }

  if (type === "table-turnover") {
    return [
      {
        title: "Revenue by table",
        type: "bar",
        data: rows.slice(0, 12).map((r) => ({
          name: String(r.tableNo ?? r.id),
          value: moneyOf(r, ["revenue", "salesValue", "sales"]),
        })),
        valueFormat: "currency",
      },
    ];
  }

  if (type === "kitchen-performance") {
    return [
      {
        title: "Tickets by kitchen",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.kitchen ?? r.id),
          value: Number(r.tickets ?? 0),
        })),
        valueFormat: "number",
      },
      {
        title: "Over SLA",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.kitchen ?? r.id),
          value: Number(r.overSla ?? 0),
        })),
        valueFormat: "number",
      },
    ];
  }

  if (type === "inventory") {
    return [
      {
        title: "Store value",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.store ?? r.id),
          value: moneyOf(r, ["value", "sales"]),
        })),
        valueFormat: "currency",
      },
    ];
  }

  if (type === "gst") {
    const byOutlet = new Map<string, number>();
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const tax = Number(r.taxValue ?? 0);
      const outlet = String(r.outlet ?? "—");
      byOutlet.set(outlet, (byOutlet.get(outlet) ?? 0) + tax);
      const day = String(r.date ?? "—");
      byDay.set(day, (byDay.get(day) ?? 0) + tax);
    }
    const cgst = rows.reduce((s, r) => s + Number(r.cgstValue ?? 0), 0);
    const sgst = rows.reduce((s, r) => s + Number(r.sgstValue ?? 0), 0);
    const igst = rows.reduce((s, r) => s + Number(r.igstValue ?? 0), 0);
    return [
      {
        title: "GST by day",
        subtitle: "Output tax collected",
        type: "area",
        data: [...byDay].map(([name, value]) => ({ name, value })),
        valueFormat: "currency",
      },
      {
        title: "GST by outlet",
        type: "bar",
        data: [...byOutlet].map(([name, value]) => ({ name, value })),
        valueFormat: "currency",
        layout: "horizontal",
      },
      {
        title: "Tax components",
        type: "pie",
        data: [
          { name: "CGST", value: cgst },
          { name: "SGST", value: sgst },
          { name: "IGST / Other", value: igst },
        ].filter((d) => d.value > 0),
        valueFormat: "currency",
      },
    ];
  }

  if (type === "cancelled-bills" || type === "discount") {
    return [
      {
        title: type === "discount" ? "Discounts" : "Cancelled value",
        type: "bar",
        data: rows.map((r) => ({
          name: String(r.billNo ?? r.outlet ?? r.id),
          value: moneyOf(r, ["discount", "amount", "gross", "sales"]),
        })),
        valueFormat: "currency",
        layout: "horizontal",
      },
    ];
  }

  return [
    {
      title: "Report values",
      type: "bar",
      data: rows.slice(0, 12).map((r) => ({
        name: String(r.date ?? r.outlet ?? r.item ?? r.id),
        value: moneyOf(r) || Number(r.bills ?? r.qty ?? r.count ?? 0),
      })),
      valueFormat: "number",
    },
  ];
}

function buildStats(
  definition: FbPageDefinition,
  rows: ModuleRow[],
  summary: Record<string, unknown> | null,
) {
  const sales =
    Number(summary?.salesTotal ?? 0) ||
    rows.reduce((s, r) => s + moneyOf(r), 0);
  const bills =
    Number(summary?.orderCount ?? 0) ||
    rows.reduce((s, r) => s + (Number(r.bills ?? 0) || 0), 0);
  const covers =
    Number(summary?.coversTotal ?? 0) ||
    rows.reduce((s, r) => s + (Number(r.covers ?? 0) || 0), 0);
  const growth = String(
    summary?.growth ?? rows[rows.length - 1]?.growth ?? "—",
  );

  return definition.stats.map((stat) => {
    const label = stat.label.toLowerCase();
    if (label === "cash" && summary?.cashLabel != null) return { ...stat, value: String(summary.cashLabel) };
    if (label === "digital" && summary?.digitalLabel != null) return { ...stat, value: String(summary.digitalLabel) };
    if (label === "variance" && summary?.varianceLabel != null) return { ...stat, value: String(summary.varianceLabel) };
    if (summary?.taxLabel != null) {
      if (label === "taxable value") return { ...stat, value: String(summary.taxableLabel) };
      if (label === "cgst") return { ...stat, value: String(summary.cgstLabel) };
      if (label === "sgst") return { ...stat, value: String(summary.sgstLabel) };
      if (label === "total gst") return { ...stat, value: String(summary.taxLabel) };
    }
    if (
      label.includes("today") ||
      label.includes("mtd total") ||
      label.includes("revenue") ||
      label.includes("discount value") ||
      label.includes("on hand") ||
      label.includes("collected")
    ) {
      return {
        ...stat,
        value: String(summary?.salesLabel ?? formatCompactInr(sales)),
      };
    }
    if (
      label === "bills" ||
      label === "cancelled today" ||
      label === "items sold"
    ) {
      return { ...stat, value: bills };
    }
    if (label === "covers") return { ...stat, value: covers };
    if (label.includes("vs yesterday") || label === "growth") {
      return { ...stat, value: growth };
    }
    if (
      label === "outlets" ||
      label === "categories" ||
      label === "unique skus"
    ) {
      return {
        ...stat,
        value: Number(summary?.outletCount ?? rows.length) || rows.length,
      };
    }
    if (label.startsWith("top ")) {
      const top =
        rows[0]?.outlet ??
        rows[0]?.item ??
        rows[0]?.category ??
        rows[0]?.reason ??
        rows[0]?.kitchen ??
        "—";
      return { ...stat, value: String(top) };
    }
    return {
      ...stat,
      value: rows.length || (typeof stat.value === "number" ? 0 : "—"),
    };
  });
}

function statIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (/gst|tax|cgst|sgst/.test(l)) return Percent;
  if (/cash|digital|collected|revenue|sales|today|mtd|value|discount|on hand|cost/.test(l)) return IndianRupee;
  if (/bill|cancel|item|sku/.test(l)) return Receipt;
  if (/cover|guest/.test(l)) return Users;
  if (/growth|vs |variance/.test(l)) return TrendingUp;
  if (/top |outlet|categor|kitchen/.test(l)) return Star;
  if (/time|sla|ticket/.test(l)) return Clock;
  return BarChart3;
}

export const FB_DEFAULT_REPORT = "daily-sales";

const FB_REPORT_ICONS: Record<string, LucideIcon> = {
  "daily-sales": TrendingUp,
  "item-sales": Receipt,
  "category-sales": BarChart3,
  "outlet-sales": Star,
  cashier: IndianRupee,
  "table-turnover": Users,
  "food-cost": Percent,
  inventory: BarChart3,
  "kitchen-performance": Clock,
  "cancelled-bills": Receipt,
  discount: Percent,
  gst: Percent,
};

const FB_REPORT_OPTIONS = Object.entries(fbPageDefinitions)
  .filter(([path]) => path.startsWith("/food-beverages/reports/"))
  .map(([path, def]) => {
    const id = reportTypeFromPath(path);
    return { id, label: def.title, icon: FB_REPORT_ICONS[id] };
  });

export function FbReportsView({
  definition,
  path,
}: {
  definition: FbPageDefinition;
  path: string;
}) {
  const router = useRouter();
  const type = reportTypeFromPath(path);
  const { outlets } = useFbOutlets(["restaurant", "cafe", "bar"]);
  const { from: fromDate, to: toDate, dateRange } = useQuickDateRange("7d");
  const [outletId, setOutletId] = useState("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fbReportService.get(type, {
          from: fromDate,
          to: toDate,
          outletId: outletId === "all" ? undefined : outletId,
        });
        if (cancelled) return;
        setRows(
          ((data.rows ?? []) as Record<string, unknown>[]).map(
            (row, i) =>
              ({
                id: String(row.id ?? `${type}-${i}`),
                ...row,
              }) as ModuleRow,
          ),
        );
        setSummary((data.summary as Record<string, unknown>) ?? null);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setSummary(null);
          setError(e instanceof Error ? e.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, fromDate, toDate, outletId, reloadKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const charts = useMemo(() => buildCharts(type, filtered), [type, filtered]);
  const kpis = useMemo(
    () =>
      buildStats(definition, rows, summary).map((stat) => ({
        label: stat.label,
        value: stat.value,
        hint: stat.sublabel,
        icon: statIcon(stat.label),
      })),
    [definition, rows, summary],
  );
  const columns = useMemo(
    () => definition.columns.map((c) => ({ key: c.key, header: c.header })),
    [definition.columns],
  );
  const outletName = outlets.find((o: FbOutlet) => o.id === outletId)?.name;

  return (
    <ReportWorkspace
      eyebrow="Food & Beverages · Reports"
      title={definition.title}
      description={definition.description}
      reportOptions={FB_REPORT_OPTIONS}
      activeReport={type}
      onReportChange={(next) => router.replace(`/food-beverages/reports?type=${next}`, { scroll: false })}
      loading={loading}
      error={error}
      onRefresh={() => setReloadKey((k) => k + 1)}
      onExport={() =>
        exportReportXlsx(definition.title, "Food & Beverages", columns, filtered as ReportRow[], [
          ["Period", `${fromDate} to ${toDate}`],
          ["Outlet", outletName ?? "All outlets"],
        ])
      }
      kpis={kpis}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={definition.searchPlaceholder}
      dateRange={dateRange}
      filters={
        <WorkspaceFilterSelect
          label="Outlet"
          value={outletId}
          onChange={setOutletId}
          allLabel="All outlets"
          options={outlets.map((o: FbOutlet) => ({ value: o.id, label: o.name }))}
        />
      }
      filtersActive={outletId !== "all"}
      onClearFilters={() => setOutletId("all")}
      columns={columns}
      rows={filtered as ReportRow[]}
      totalRows={rows.length}
      charts={charts}
    />
  );
}
