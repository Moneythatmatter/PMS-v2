"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, IndianRupee, PackageX } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import {
  psCategoryService,
  psProductService,
  psStockBalanceService,
  psStockLedgerService,
  psWarehouseService,
} from "@/services/purchase-stores/index";
import type { StockLedgerRecord } from "@/app/data/stockLedgerData";
import {
  PsReportView,
  ReportFilterSelect,
  ReportStatusPill,
  distinct,
  formatCompactMoney,
  formatQty,
  groupSum,
  sumBy,
  useReportPeriod,
  type ReportColumn,
} from "@/components/purchase-stores/reports/PsReportView";

type StockRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  department: string;
  warehouse: string;
  unit: string;
  opening: number;
  received: number;
  issued: number;
  closing: number;
  avgCost: number;
  value: number;
  reorderLevel: number;
  status: "In Stock" | "Below Reorder" | "Out of Stock";
};

export default function StockRegisterReportPage() {
  const period = useReportPeriod("fy");
  const balances = usePsList(() => psStockBalanceService.list(), []);
  const ledger = usePsList(() => psStockLedgerService.list(), []);
  const products = usePsList(() => psProductService.list(), []);
  const categories = usePsList(() => psCategoryService.list(), []);
  const warehouses = usePsList(() => psWarehouseService.list(), []);

  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRows = useMemo<StockRow[]>(() => {
    const productById = new Map(products.data.map((p) => [p.id, p]));
    const warehouseById = new Map(warehouses.data.map((w) => [w.id, w.name]));
    const deptByCategory = new Map(categories.data.map((c) => [c.categoryName, c.department]));
    const movements = new Map<string, StockLedgerRecord[]>();
    for (const m of ledger.data) {
      const key = `${m.materialId}|${m.warehouseId}`;
      movements.set(key, [...(movements.get(key) ?? []), m]);
    }

    return balances.data.map((b) => {
      const product = productById.get(b.materialId);
      const moves = movements.get(`${b.materialId}|${b.warehouseId}`) ?? [];
      let netAfter = 0;
      let received = 0;
      let issued = 0;
      for (const m of moves) {
        const day = String(m.transactionDate ?? "").slice(0, 10);
        if (period.to && day > period.to) netAfter += (m.quantityIn || 0) - (m.quantityOut || 0);
        else if (period.inPeriod(day)) {
          received += m.quantityIn || 0;
          issued += m.quantityOut || 0;
        }
      }
      const closing = (Number(b.quantity) || 0) - netAfter;
      const reorderLevel = Number(product?.reorderLevel) || 0;
      const status: StockRow["status"] =
        closing <= 0 ? "Out of Stock" : reorderLevel > 0 && closing <= reorderLevel ? "Below Reorder" : "In Stock";
      const avgCost = Number(b.averageCost) || 0;
      return {
        id: b.id,
        code: product?.productCode ?? b.materialId,
        name: product?.productName ?? "Unknown material",
        category: product?.category ?? "",
        department: deptByCategory.get(product?.category ?? "") ?? "",
        warehouse: warehouseById.get(b.warehouseId) ?? "Unknown warehouse",
        unit: product?.unit ?? "",
        opening: closing - (received - issued),
        received,
        issued,
        closing,
        avgCost,
        value: Math.max(0, closing) * avgCost,
        reorderLevel,
        status,
      };
    });
  }, [balances.data, ledger.data, products.data, categories.data, warehouses.data, period]);

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

  const columns: ReportColumn<StockRow>[] = [
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
    { key: "warehouse", header: "Warehouse", value: (r) => r.warehouse },
    { key: "unit", header: "Unit", value: (r) => r.unit },
    { key: "opening", header: "Opening", value: (r) => r.opening, format: "number", align: "right", total: true },
    {
      key: "received",
      header: "Received",
      value: (r) => r.received,
      align: "right",
      total: true,
      render: (r) => <span className={r.received ? "text-emerald-700" : "text-slate-300"}>{r.received ? `+${formatQty(r.received)}` : "0"}</span>,
    },
    {
      key: "issued",
      header: "Issued",
      value: (r) => r.issued,
      align: "right",
      total: true,
      render: (r) => <span className={r.issued ? "text-red-600" : "text-slate-300"}>{r.issued ? `−${formatQty(r.issued)}` : "0"}</span>,
    },
    {
      key: "closing",
      header: "Closing",
      value: (r) => r.closing,
      align: "right",
      total: true,
      render: (r) => <span className="font-semibold text-slate-900">{formatQty(r.closing)}</span>,
    },
    { key: "avgCost", header: "Avg. Cost", value: (r) => r.avgCost, format: "currency", align: "right" },
    {
      key: "value",
      header: "Stock Value",
      value: (r) => r.value,
      format: "currency",
      align: "right",
      total: true,
      className: "font-medium text-slate-900",
    },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
  ];

  const totalValue = sumBy(rows, (r) => r.value);
  const belowReorder = rows.filter((r) => r.status === "Below Reorder").length;
  const outOfStock = rows.filter((r) => r.status === "Out of Stock").length;
  const loading = balances.loading || ledger.loading || products.loading;
  const activeFilterCount = [warehouseFilter, categoryFilter, statusFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Stock Register"
      description="Opening, receipts, issues and closing stock with valuation for every item and warehouse."
      loading={loading}
      error={balances.error || ledger.error || products.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "value", dir: "desc" }}
      searchPlaceholder="Search item, code, category or warehouse…"
      rowClassName={(r) => (r.status === "Out of Stock" ? "bg-red-50/40" : undefined)}
      stats={[
        { label: "Closing Stock Value", value: formatCompactMoney(totalValue), sublabel: `${rows.length} item–warehouse lines`, icon: IndianRupee, accent: "#059669" },
        { label: "Items In Stock", value: rows.filter((r) => r.closing > 0).length, sublabel: `${distinct(rows.map((r) => r.warehouse)).length} warehouses`, icon: Boxes, accent: "#2563eb" },
        { label: "Below Reorder", value: belowReorder, sublabel: "At or under reorder level", icon: AlertTriangle, accent: "#d97706" },
        { label: "Out of Stock", value: outOfStock, sublabel: "Zero or negative closing", icon: PackageX, accent: "#dc2626" },
      ]}
      charts={[
        { title: "Stock value by category", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(rows, (r) => r.category, (r) => r.value) },
        { title: "Stock value by warehouse", type: "pie", valueFormat: "currency", data: groupSum(rows, (r) => r.warehouse, (r) => r.value, 6) },
        { title: "Top items by value", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(rows, (r) => r.name, (r) => r.value, 10).filter((d) => d.name !== "Others") },
        {
          title: "Stock health",
          type: "pie",
          valueFormat: "number",
          data: (["In Stock", "Below Reorder", "Out of Stock"] as const)
            .map((s, i) => ({ name: s, value: rows.filter((r) => r.status === s).length, color: ["#10b981", "#f59e0b", "#ef4444"][i] }))
            .filter((d) => d.value > 0),
        },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setWarehouseFilter("all");
        setCategoryFilter("all");
        setStatusFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Warehouses" value={warehouseFilter} onChange={setWarehouseFilter} options={distinct(allRows.map((r) => r.warehouse))} />
          <ReportFilterSelect label="Categories" value={categoryFilter} onChange={setCategoryFilter} options={distinct(allRows.map((r) => r.category))} />
          <ReportFilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["In Stock", "Below Reorder", "Out of Stock"]} allLabel="All statuses" />
        </>
      }
    />
  );
}
