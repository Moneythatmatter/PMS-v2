"use client";

import { useMemo, useState } from "react";
import { CalendarX2, IndianRupee, PackageMinus, ShieldAlert } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import {
  psProductService,
  psStockAdjustmentService,
  psStockBalanceService,
  psWarehouseService,
} from "@/services/purchase-stores/index";
import {
  PsReportView,
  ReportFilterSelect,
  ReportStatusPill,
  distinct,
  formatCompactMoney,
  formatQty,
  groupSum,
  monthlySum,
  sumBy,
  useReportPeriod,
  type ReportColumn,
} from "@/components/purchase-stores/reports/PsReportView";
import { cn } from "@/lib/utils";

type LossType = "Expired" | "Damaged" | "Count Variance" | "Other";

type SpoilageRow = {
  id: string;
  date: string;
  adjustmentNo: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  warehouse: string;
  reason: string;
  lossType: LossType;
  qty: number;
  unitCost: number;
  value: number;
  requestedBy: string;
  approvedBy: string;
  status: string;
};

function classifyLoss(reason: string): LossType {
  const r = reason.toLowerCase();
  if (r.includes("expir")) return "Expired";
  if (r.includes("damag") || r.includes("spoil") || r.includes("broken") || r.includes("scrap")) return "Damaged";
  if (r.includes("count") || r.includes("audit") || r.includes("correction")) return "Count Variance";
  return "Other";
}

const LOSS_TONE: Record<LossType, string> = {
  Expired: "bg-amber-50 text-amber-800 ring-amber-200",
  Damaged: "bg-red-50 text-red-700 ring-red-200",
  "Count Variance": "bg-blue-50 text-blue-700 ring-blue-200",
  Other: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function SpoilageReportPage() {
  const period = useReportPeriod("fy");
  const adjustments = usePsList(() => psStockAdjustmentService.list(), []);
  const balances = usePsList(() => psStockBalanceService.list(), []);
  const products = usePsList(() => psProductService.list(), []);
  const warehouses = usePsList(() => psWarehouseService.list(), []);

  const [lossFilter, setLossFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const allRows = useMemo<SpoilageRow[]>(() => {
    const productById = new Map(products.data.map((p) => [p.id, p]));
    const warehouseById = new Map(warehouses.data.map((w) => [w.id, w.name]));
    const costByKey = new Map(balances.data.map((b) => [`${b.materialId}|${b.warehouseId}`, Number(b.averageCost) || 0]));
    const costByMaterial = new Map(balances.data.map((b) => [b.materialId, Number(b.averageCost) || 0]));

    return adjustments.data
      .filter((a) => (Number(a.difference) || 0) < 0 && !/reject/i.test(a.status) && period.inPeriod(a.adjustmentDate))
      .map((a) => {
        const product = productById.get(a.materialId);
        const qty = Math.abs(Number(a.difference) || 0);
        const unitCost = costByKey.get(`${a.materialId}|${a.warehouseId}`) ?? costByMaterial.get(a.materialId) ?? 0;
        return {
          id: a.id,
          date: a.adjustmentDate,
          adjustmentNo: a.adjustmentNo,
          code: product?.productCode ?? a.materialId,
          name: product?.productName ?? "Unknown material",
          category: product?.category ?? "",
          unit: product?.unit ?? "",
          warehouse: warehouseById.get(a.warehouseId) ?? "Unknown warehouse",
          reason: a.reason,
          lossType: classifyLoss(a.reason ?? ""),
          qty,
          unitCost,
          value: qty * unitCost,
          requestedBy: a.requestedBy,
          approvedBy: a.approvedBy ?? "",
          status: a.status,
        };
      });
  }, [adjustments.data, balances.data, products.data, warehouses.data, period]);

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (lossFilter === "all" || r.lossType === lossFilter) &&
          (warehouseFilter === "all" || r.warehouse === warehouseFilter) &&
          (categoryFilter === "all" || r.category === categoryFilter),
      ),
    [allRows, lossFilter, warehouseFilter, categoryFilter],
  );

  const columns: ReportColumn<SpoilageRow>[] = [
    { key: "date", header: "Date", value: (r) => r.date, format: "date" },
    { key: "adjustmentNo", header: "Adjustment No.", value: (r) => r.adjustmentNo, className: "font-mono text-xs font-semibold text-slate-900" },
    {
      key: "item",
      header: "Item",
      value: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-[11px] text-slate-400">
            <span className="font-mono">{r.code}</span>
            {r.category ? ` · ${r.category}` : ""}
          </p>
        </div>
      ),
    },
    { key: "category", header: "Category", value: (r) => r.category, hidden: true },
    { key: "warehouse", header: "Warehouse", value: (r) => r.warehouse },
    {
      key: "lossType",
      header: "Loss Type",
      value: (r) => r.lossType,
      render: (r) => (
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", LOSS_TONE[r.lossType])}>{r.lossType}</span>
      ),
    },
    { key: "reason", header: "Reason", value: (r) => r.reason, className: "max-w-[14rem] truncate text-slate-500" },
    {
      key: "qty",
      header: "Qty Lost",
      value: (r) => r.qty,
      align: "right",
      total: true,
      render: (r) => (
        <span className="font-medium text-red-600">
          {formatQty(r.qty)} <span className="text-[11px] font-normal text-slate-400">{r.unit}</span>
        </span>
      ),
    },
    { key: "unitCost", header: "Unit Cost", value: (r) => r.unitCost, format: "currency", align: "right" },
    { key: "value", header: "Loss Value", value: (r) => r.value, format: "currency", align: "right", total: true, className: "font-semibold text-red-700" },
    { key: "requestedBy", header: "Requested By", value: (r) => r.requestedBy },
    { key: "approvedBy", header: "Approved By", value: (r) => r.approvedBy, hidden: true },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
  ];

  const valueOf = (t: LossType) => sumBy(rows.filter((r) => r.lossType === t), (r) => r.value);
  const activeFilterCount = [lossFilter, warehouseFilter, categoryFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Spoilage & Write-off Report"
      description="Stock lost to expiry, damage and count variances, valued at weighted average cost."
      loading={adjustments.loading || balances.loading || products.loading}
      error={adjustments.error || balances.error || products.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "value", dir: "desc" }}
      searchPlaceholder="Search item, adjustment no., reason…"
      emptyMessage="No write-offs recorded in this period."
      stats={[
        { label: "Total Loss Value", value: formatCompactMoney(sumBy(rows, (r) => r.value)), sublabel: `${rows.length} write-off entries`, icon: IndianRupee, accent: "#dc2626" },
        { label: "Units Written Off", value: formatQty(sumBy(rows, (r) => r.qty)), sublabel: `${distinct(rows.map((r) => r.name)).length} distinct items`, icon: PackageMinus, accent: "#7c3aed" },
        { label: "Expired", value: formatCompactMoney(valueOf("Expired")), sublabel: "Expiry write-offs", icon: CalendarX2, accent: "#d97706" },
        { label: "Damaged", value: formatCompactMoney(valueOf("Damaged")), sublabel: "Damage & spoilage", icon: ShieldAlert, accent: "#e11d48" },
      ]}
      charts={[
        {
          title: "Loss by type",
          type: "pie",
          valueFormat: "currency",
          data: (["Expired", "Damaged", "Count Variance", "Other"] as const)
            .map((t, i) => ({ name: t, value: Math.round(valueOf(t) * 100) / 100, color: ["#f59e0b", "#ef4444", "#3b82f6", "#94a3b8"][i] }))
            .filter((d) => d.value > 0),
        },
        { title: "Loss by category", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(rows, (r) => r.category, (r) => r.value) },
        { title: "Monthly loss trend", type: "area", valueFormat: "currency", data: monthlySum(rows, (r) => r.date, (r) => r.value) },
        { title: "Top items written off", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(rows, (r) => r.name, (r) => r.value, 10).filter((d) => d.name !== "Others") },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setLossFilter("all");
        setWarehouseFilter("all");
        setCategoryFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Loss types" value={lossFilter} onChange={setLossFilter} options={["Expired", "Damaged", "Count Variance", "Other"]} />
          <ReportFilterSelect label="Warehouses" value={warehouseFilter} onChange={setWarehouseFilter} options={distinct(allRows.map((r) => r.warehouse))} />
          <ReportFilterSelect label="Categories" value={categoryFilter} onChange={setCategoryFilter} options={distinct(allRows.map((r) => r.category))} />
        </>
      }
    />
  );
}
