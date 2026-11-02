"use client";

import { useMemo, useState } from "react";
import { IndianRupee, PackageX, RotateCcw, Truck } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import { psPurchaseOrderService, psVendorReturnService } from "@/services/purchase-stores/index";
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

type ReturnRow = {
  id: string;
  returnNo: string;
  date: string;
  supplier: string;
  grnNumber: string;
  inspectionNumber: string;
  poNumber: string;
  warehouse: string;
  itemCount: number;
  units: number;
  value: number;
  reason: string;
  settlement: "Replacement" | "Credit Note";
  replacementStatus: string;
  status: string;
  items: { name: string; units: number }[];
};

export default function VendorReturnsReportPage() {
  const period = useReportPeriod("fy");
  const returns = usePsList(() => psVendorReturnService.list(), []);
  const orders = usePsList(() => psPurchaseOrderService.list(), []);

  const [supplierFilter, setSupplierFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [settlementFilter, setSettlementFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRows = useMemo<ReturnRow[]>(() => {
    const rateByPoItem = new Map<string, number>();
    for (const po of orders.data) {
      for (const line of po.items ?? []) {
        const code = line.productCode || line.itemCode;
        if (code) rateByPoItem.set(`${po.poNumber}|${code}`, Number(line.unitRate) || 0);
      }
    }

    return returns.data
      .filter((v) => period.inPeriod(v.returnDate))
      .map((v) => {
        const items = v.items ?? [];
        const units = sumBy(items, (i) => i.returnQty);
        const value = sumBy(items, (i) => (Number(i.returnQty) || 0) * (rateByPoItem.get(`${v.poNumber}|${i.productCode}`) ?? 0));
        const replacement = v.replacementDetails?.replacementRequired ?? false;
        return {
          id: v.id,
          returnNo: v.returnNumber,
          date: v.returnDate,
          supplier: v.supplierName,
          grnNumber: v.grnNumber,
          inspectionNumber: v.inspectionNumber,
          poNumber: v.poNumber,
          warehouse: v.warehouse,
          itemCount: items.length,
          units,
          value,
          reason: v.returnReason,
          settlement: replacement ? "Replacement" : "Credit Note",
          replacementStatus: replacement ? v.replacementDetails?.status ?? "Pending" : "Not Applicable",
          status: v.status,
          items: items.map((i) => ({ name: i.productName, units: Number(i.returnQty) || 0 })),
        };
      });
  }, [returns.data, orders.data, period]);

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (supplierFilter === "all" || r.supplier === supplierFilter) &&
          (reasonFilter === "all" || r.reason === reasonFilter) &&
          (settlementFilter === "all" || r.settlement === settlementFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [allRows, supplierFilter, reasonFilter, settlementFilter, statusFilter],
  );

  const columns: ReportColumn<ReturnRow>[] = [
    { key: "date", header: "Date", value: (r) => r.date, format: "date" },
    { key: "returnNo", header: "Return No.", value: (r) => r.returnNo, className: "font-mono text-xs font-semibold text-slate-900" },
    { key: "supplier", header: "Supplier", value: (r) => r.supplier, className: "font-medium text-slate-900" },
    {
      key: "refs",
      header: "References",
      value: (r) => `${r.inspectionNumber} ${r.grnNumber} ${r.poNumber}`,
      exportable: false,
      render: (r) => (
        <div className="font-mono text-[11px] leading-4">
          <p className="text-emerald-700">{r.inspectionNumber || "—"}</p>
          <p className="text-slate-400">
            {r.grnNumber || "—"} · {r.poNumber || "—"}
          </p>
        </div>
      ),
    },
    { key: "inspection", header: "Inspection", value: (r) => r.inspectionNumber, hidden: true },
    { key: "grn", header: "GRN", value: (r) => r.grnNumber, hidden: true },
    { key: "po", header: "PO", value: (r) => r.poNumber, hidden: true },
    { key: "warehouse", header: "Warehouse", value: (r) => r.warehouse },
    { key: "reason", header: "Reason", value: (r) => r.reason },
    { key: "items", header: "Items", value: (r) => r.itemCount, format: "number", align: "right", total: true },
    {
      key: "units",
      header: "Units",
      value: (r) => r.units,
      align: "right",
      total: true,
      render: (r) => <span className="font-medium text-red-600">{formatQty(r.units)}</span>,
    },
    { key: "value", header: "Value (PO rate)", value: (r) => r.value, format: "currency", align: "right", total: true, className: "font-semibold text-slate-900" },
    {
      key: "settlement",
      header: "Settlement",
      value: (r) => r.settlement,
      render: (r) => (
        <div>
          <p className="text-slate-800">{r.settlement}</p>
          {r.settlement === "Replacement" && <p className="text-[11px] text-slate-400">{r.replacementStatus}</p>}
        </div>
      ),
    },
    { key: "replacementStatus", header: "Replacement Status", value: (r) => r.replacementStatus, hidden: true },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
  ];

  const open = rows.filter((r) => /pending|sent/i.test(r.status));
  const bySupplier = groupSum(rows, (r) => r.supplier, (r) => r.value);
  const activeFilterCount = [supplierFilter, reasonFilter, settlementFilter, statusFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Vendor Returns Report"
      description="Goods returned to suppliers after quality inspection — by supplier, reason and settlement."
      loading={returns.loading || orders.loading}
      error={returns.error || orders.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "date", dir: "desc" }}
      searchPlaceholder="Search return no., supplier, GRN, inspection…"
      emptyMessage="No vendor returns in this period."
      stats={[
        { label: "Returns", value: rows.length, sublabel: `${distinct(rows.map((r) => r.supplier)).length} suppliers`, icon: RotateCcw, accent: "#dc2626" },
        { label: "Units Returned", value: formatQty(sumBy(rows, (r) => r.units)), sublabel: `${sumBy(rows, (r) => r.itemCount)} line items`, icon: PackageX, accent: "#7c3aed" },
        { label: "Return Value", value: formatCompactMoney(sumBy(rows, (r) => r.value)), sublabel: bySupplier[0] ? `Most: ${bySupplier[0].name}` : "Valued at PO rate", icon: IndianRupee, accent: "#059669" },
        { label: "Open Returns", value: open.length, sublabel: "Pending pickup or replacement", icon: Truck, accent: "#d97706" },
      ]}
      charts={[
        { title: "Returns by reason", type: "pie", valueFormat: "number", data: groupSum(rows, (r) => r.reason, () => 1, 6) },
        { title: "Return value by supplier", type: "bar", layout: "horizontal", valueFormat: "currency", data: bySupplier },
        { title: "Monthly returns (units)", type: "area", valueFormat: "number", data: monthlySum(rows, (r) => r.date, (r) => r.units) },
        { title: "Most returned items (units)", type: "bar", layout: "horizontal", valueFormat: "number", data: groupSum(rows.flatMap((r) => r.items), (i) => i.name, (i) => i.units, 10).filter((d) => d.name !== "Others") },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setSupplierFilter("all");
        setReasonFilter("all");
        setSettlementFilter("all");
        setStatusFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Suppliers" value={supplierFilter} onChange={setSupplierFilter} options={distinct(allRows.map((r) => r.supplier))} />
          <ReportFilterSelect label="Reasons" value={reasonFilter} onChange={setReasonFilter} options={distinct(allRows.map((r) => r.reason))} />
          <ReportFilterSelect label="Settlement" value={settlementFilter} onChange={setSettlementFilter} options={["Replacement", "Credit Note"]} allLabel="All settlements" />
          <ReportFilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={distinct(allRows.map((r) => r.status))} allLabel="All statuses" />
        </>
      }
    />
  );
}
