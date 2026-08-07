"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Search, Table2 } from "lucide-react";
import type { FbPageDefinition } from "@/app/data/foodbeverages/modules";
import type { ReportChartConfig } from "@/app/data/frontoffice/reports";
import { formatINR } from "@/app/data/foodbeverages/ops";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { SelectInput, FODatePicker } from "@/components/frontoffice/ui";
import {
  ModuleDataTable,
  ModulePageShell,
  type ModuleRow,
} from "@/components/pms";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  fbReportService,
  type FbOutlet,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

type ViewMode = "table" | "graph";
type RangeId = "today" | "7d" | "30d" | "mtd" | "custom";

const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "mtd", label: "Month to date" },
  { id: "custom", label: "Custom range" },
];

function toIsoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeToDates(range: RangeId): { from: string; to: string } {
  const to = new Date();
  to.setHours(12, 0, 0, 0);
  const from = new Date(to);
  if (range === "today") {
    /* same day */
  } else if (range === "30d") {
    from.setDate(to.getDate() - 29);
  } else if (range === "mtd") {
    from.setDate(1);
  } else {
    from.setDate(to.getDate() - 6);
  }
  return { from: toIsoDay(from), to: toIsoDay(to) };
}

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

function exportCsv(
  title: string,
  columns: FbPageDefinition["columns"],
  rows: ModuleRow[],
) {
  const header = columns.map((c) => c.header).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FbReportsView({
  definition,
  path,
}: {
  definition: FbPageDefinition;
  path: string;
}) {
  const type = reportTypeFromPath(path);
  const { outlets } = useFbOutlets(["restaurant", "cafe", "bar", "banquet"]);
  const [range, setRange] = useState<RangeId>("7d");
  const initialDates = rangeToDates("7d");
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [outletId, setOutletId] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyRange = (next: RangeId) => {
    setRange(next);
    if (next === "custom") return;
    const dates = rangeToDates(next);
    setFromDate(dates.from);
    setToDate(dates.to);
  };

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
  }, [type, fromDate, toDate, outletId]);

  const charts = useMemo(() => buildCharts(type, rows), [type, rows]);
  const stats = useMemo(
    () => buildStats(definition, rows, summary),
    [definition, rows, summary],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const toolbar = (
    <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm scrollbar-none">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={definition.searchPlaceholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <SelectInput
        value={range}
        onChange={(e) => applyRange(e.target.value as RangeId)}
        className="!h-10 !w-auto min-w-[9.5rem] shrink-0"
        aria-label="Date range"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </SelectInput>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          From
        </span>
        <div className="w-[9.25rem]">
          <FODatePicker
            value={fromDate}
            placeholder="From date"
            className="!h-10"
            onChange={(value) => {
              setFromDate(value);
              setRange("custom");
              if (toDate && value > toDate) setToDate(value);
            }}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          To
        </span>
        <div className="w-[9.25rem]">
          <FODatePicker
            value={toDate}
            placeholder="To date"
            className="!h-10"
            onChange={(value) => {
              setToDate(value);
              setRange("custom");
              if (fromDate && value < fromDate) setFromDate(value);
            }}
          />
        </div>
      </div>
      <SelectInput
        value={outletId}
        onChange={(e) => setOutletId(e.target.value)}
        className="!h-10 !w-auto min-w-[11rem] shrink-0"
        aria-label="Outlet"
      >
        <option value="all">All outlets</option>
        {outlets.map((o: FbOutlet) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </SelectInput>
      <div
        className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        role="tablist"
        aria-label="Report view"
      >
        {(
          [
            { id: "table", label: "Table", icon: Table2 },
            { id: "graph", label: "Graph report", icon: BarChart3 },
          ] as const
        ).map((opt) => {
          const Icon = opt.icon;
          const active = viewMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900",
              )}
              onClick={() => setViewMode(opt.id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Food & Beverages · Reports"
        title={definition.title}
        description={definition.description}
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading report…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Food & Beverages · Reports"
        title={definition.title}
        description={definition.description}
        wrapChildren={false}
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          <p className="font-semibold">Could not load report</p>
          <p className="mt-1">{error}</p>
        </div>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Food & Beverages · Reports"
      title={definition.title}
      description={definition.description}
      wrapChildren={false}
      stats={stats}
      actionButtons={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => exportCsv(definition.title, definition.columns, filtered)}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      }
      aboveTable={
        <div className="space-y-3">
          {toolbar}
          {viewMode === "table" ? (
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">{filtered.length}</span> of{" "}
              {rows.length} records
              {summary?.from
                ? ` · ${String(summary.from)} → ${String(summary.to)}`
                : ""}
            </p>
          ) : null}
          {viewMode === "graph" ? (
            charts.length ? (
              <ReportCharts charts={charts} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                No chart data for the selected filters.
              </div>
            )
          ) : null}
        </div>
      }
    >
      {viewMode === "table" ? (
        <ModuleDataTable
          columns={definition.columns}
          rows={filtered}
          emptyMessage="No records match your search or filters."
        />
      ) : null}
    </ModulePageShell>
  );
}
