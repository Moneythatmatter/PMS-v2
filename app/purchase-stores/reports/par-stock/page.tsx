"use client";

import { useMemo, useState } from "react";
import { AlertOctagon, ArrowDownToLine, ClipboardList, PackagePlus } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import { psParStockService } from "@/services/purchase-stores/index";
import { deriveParStockStatus, type ParStockStatus } from "@/app/data/parStockData";
import {
  PsReportView,
  ReportFilterSelect,
  ReportProgress,
  ReportStatusPill,
  distinct,
  formatQty,
  groupSum,
  type ReportColumn,
} from "@/components/purchase-stores/reports/PsReportView";

type ParRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  warehouse: string;
  store: string;
  unit: string;
  current: number;
  min: number;
  reorder: number;
  par: number;
  max: number;
  shortfall: number;
  suggestedOrder: number;
  fill: number;
  status: ParStockStatus;
  lastIssued: string;
  lastReceived: string;
};

const STATUS_ORDER: ParStockStatus[] = ["Critical", "Below Par", "OK", "Overstock"];

export default function ParStockReportPage() {
  const parStock = usePsList(() => psParStockService.list(), []);

  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRows = useMemo<ParRow[]>(
    () =>
      parStock.data.map((p) => {
        const current = Number(p.currentStock) || 0;
        const par = Number(p.parLevel) || 0;
        const min = Number(p.minLevel) || 0;
        const max = Number(p.maxLevel) || par;
        const status = deriveParStockStatus(current, par, min, max);
        return {
          id: p.id,
          code: p.itemCode,
          name: p.itemName,
          category: p.category,
          warehouse: p.warehouse,
          store: p.store,
          unit: p.unit,
          current,
          min,
          reorder: Number(p.reorderLevel) || 0,
          par,
          max,
          shortfall: Math.max(0, par - current),
          suggestedOrder: status === "Critical" || status === "Below Par" ? Math.max(0, max - current) : 0,
          fill: par > 0 ? (current / par) * 100 : 0,
          status,
          lastIssued: p.lastIssuedDate ?? "",
          lastReceived: p.lastReceivedDate ?? "",
        };
      }),
    [parStock.data],
  );

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (warehouseFilter === "all" || r.warehouse === warehouseFilter) &&
          (categoryFilter === "all" || r.category === categoryFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [allRows, warehouseFilter, categoryFilter, statusFilter],
  );

  const columns: ReportColumn<ParRow>[] = [
    {
      key: "item",
      header: "Item",
      value: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{r.code}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", value: (r) => r.category },
    {
      key: "location",
      header: "Location",
      value: (r) => `${r.warehouse} ${r.store}`,
      render: (r) => (
        <div>
          <p>{r.warehouse || "—"}</p>
          {r.store && <p className="text-[11px] text-slate-400">{r.store}</p>}
        </div>
      ),
    },
    { key: "unit", header: "Unit", value: (r) => r.unit },
    {
      key: "current",
      header: "On Hand",
      value: (r) => r.current,
      align: "right",
      render: (r) => (
        <span className={r.status === "Critical" ? "font-semibold text-red-600" : "font-semibold text-slate-900"}>{formatQty(r.current)}</span>
      ),
    },
    { key: "min", header: "Min", value: (r) => r.min, format: "number", align: "right", className: "text-slate-500" },
    { key: "reorder", header: "Reorder", value: (r) => r.reorder, format: "number", align: "right", className: "text-slate-500" },
    { key: "par", header: "Par", value: (r) => r.par, format: "number", align: "right", className: "font-medium text-slate-800" },
    { key: "max", header: "Max", value: (r) => r.max, format: "number", align: "right", className: "text-slate-500" },
    {
      key: "fill",
      header: "Par Fill",
      value: (r) => Math.round(r.fill),
      render: (r) => (
        <ReportProgress
          value={r.fill}
          tone={r.status === "Critical" ? "red" : r.status === "Below Par" ? "amber" : r.status === "Overstock" ? "blue" : "emerald"}
        />
      ),
    },
    {
      key: "shortfall",
      header: "Shortfall",
      value: (r) => r.shortfall,
      align: "right",
      total: true,
      render: (r) => <span className={r.shortfall ? "text-amber-700" : "text-slate-300"}>{formatQty(r.shortfall)}</span>,
    },
    {
      key: "suggestedOrder",
      header: "Suggested Order",
      value: (r) => r.suggestedOrder,
      align: "right",
      total: true,
      render: (r) =>
        r.suggestedOrder ? (
          <span className="font-semibold text-emerald-700">
            {formatQty(r.suggestedOrder)} <span className="text-[11px] font-normal text-slate-400">{r.unit}</span>
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
    { key: "lastIssued", header: "Last Issued", value: (r) => r.lastIssued, format: "date", hidden: true },
    { key: "lastReceived", header: "Last Received", value: (r) => r.lastReceived, format: "date", hidden: true },
  ];

  const count = (s: ParStockStatus) => rows.filter((r) => r.status === s).length;
  const toReorder = rows.filter((r) => r.suggestedOrder > 0);
  const activeFilterCount = [warehouseFilter, categoryFilter, statusFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Par Stock Report"
      description="Current stock against par, minimum and maximum levels — with suggested reorder quantities."
      loading={parStock.loading}
      error={parStock.error}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "fill", dir: "asc" }}
      searchPlaceholder="Search item, code, category or store…"
      rowClassName={(r) => (r.status === "Critical" ? "bg-red-50/40" : undefined)}
      stats={[
        { label: "Items Tracked", value: rows.length, sublabel: `${distinct(rows.map((r) => r.warehouse)).length} locations`, icon: ClipboardList, accent: "#2563eb" },
        { label: "Critical", value: count("Critical"), sublabel: "At or below minimum", icon: AlertOctagon, accent: "#dc2626" },
        { label: "Below Par", value: count("Below Par"), sublabel: "Under par, above minimum", icon: ArrowDownToLine, accent: "#d97706" },
        { label: "To Reorder", value: toReorder.length, sublabel: `Overstocked: ${count("Overstock")}`, icon: PackagePlus, accent: "#059669" },
      ]}
      charts={[
        {
          title: "Par status",
          type: "pie",
          valueFormat: "number",
          data: STATUS_ORDER.map((s, i) => ({ name: s, value: count(s), color: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"][i] })).filter((d) => d.value > 0),
        },
        { title: "Largest shortfalls", type: "bar", layout: "horizontal", valueFormat: "number", data: groupSum(rows.filter((r) => r.shortfall > 0), (r) => r.name, (r) => r.shortfall, 10).filter((d) => d.name !== "Others") },
        { title: "Items needing reorder by category", type: "bar", layout: "horizontal", valueFormat: "number", data: groupSum(toReorder, (r) => r.category, () => 1) },
        { title: "Items by location", type: "pie", valueFormat: "number", data: groupSum(rows, (r) => r.warehouse, () => 1, 6) },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setWarehouseFilter("all");
        setCategoryFilter("all");
        setStatusFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Locations" value={warehouseFilter} onChange={setWarehouseFilter} options={distinct(allRows.map((r) => r.warehouse))} />
          <ReportFilterSelect label="Categories" value={categoryFilter} onChange={setCategoryFilter} options={distinct(allRows.map((r) => r.category))} />
          <ReportFilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_ORDER} allLabel="All statuses" />
        </>
      }
    />
  );
}
