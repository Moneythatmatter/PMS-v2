"use client";

import { useMemo, useState } from "react";
import { IndianRupee, ShoppingCart, Users, Zap } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import { psDspService, psPurchaseOrderService } from "@/services/purchase-stores/index";
import {
  PsReportView,
  ReportFilterSelect,
  ReportStatusPill,
  distinct,
  formatCompactMoney,
  groupSum,
  monthlySum,
  sumBy,
  useReportPeriod,
  type ReportColumn,
} from "@/components/purchase-stores/reports/PsReportView";
import { cn } from "@/lib/utils";

type PurchaseRow = {
  id: string;
  date: string;
  docNo: string;
  type: "Purchase Order" | "Direct Purchase";
  vendor: string;
  department: string;
  itemCount: number;
  subTotal: number;
  tax: number;
  total: number;
  status: string;
  lines: { category: string; amount: number }[];
};

/** Drafts, cancellations, rejections and unapproved POs aren't committed spend. */
const isCommitted = (type: PurchaseRow["type"], status: string) =>
  !/draft|cancel|reject/i.test(status) && !(type === "Purchase Order" && /pending/i.test(status));

export default function PurchasesReportPage() {
  const period = useReportPeriod("fy");
  const orders = usePsList(() => psPurchaseOrderService.list(), []);
  const dsps = usePsList(() => psDspService.list(), []);

  const [typeFilter, setTypeFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const allRows = useMemo<PurchaseRow[]>(() => {
    const poRows: PurchaseRow[] = orders.data.map((po) => ({
      id: `po-${po.id}`,
      date: po.orderDate,
      docNo: po.poNumber,
      type: "Purchase Order",
      vendor: po.vendorName,
      department: po.department,
      itemCount: po.items?.length ?? 0,
      subTotal: Number(po.subTotal) || 0,
      tax: Number(po.taxAmount) || 0,
      total: Number(po.totalAmount) || 0,
      status: po.status,
      lines: (po.items ?? []).map((i) => ({ category: i.category, amount: Number(i.totalAmount) || i.quantity * i.unitRate })),
    }));
    const dspRows: PurchaseRow[] = dsps.data.map((d) => ({
      id: `dsp-${d.id}`,
      date: d.purchaseDate,
      docNo: d.dspNumber,
      type: "Direct Purchase",
      vendor: d.vendorName,
      department: d.department,
      itemCount: d.items?.length ?? 0,
      subTotal: Number(d.netAmount) || 0,
      tax: Number(d.taxAmount) || 0,
      total: Number(d.totalAmount) || 0,
      status: d.status,
      lines: (d.items ?? []).map((i) => ({ category: i.category, amount: Number(i.lineAmount) || i.quantity * i.unitRate })),
    }));
    return [...poRows, ...dspRows].filter((r) => isCommitted(r.type, r.status) && period.inPeriod(r.date));
  }, [orders.data, dsps.data, period]);

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (typeFilter === "all" || r.type === typeFilter) &&
          (vendorFilter === "all" || r.vendor === vendorFilter) &&
          (departmentFilter === "all" || r.department === departmentFilter),
      ),
    [allRows, typeFilter, vendorFilter, departmentFilter],
  );

  const columns: ReportColumn<PurchaseRow>[] = [
    { key: "date", header: "Date", value: (r) => r.date, format: "date" },
    {
      key: "docNo",
      header: "Document",
      value: (r) => r.docNo,
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-slate-900">{r.docNo}</p>
          <p className={cn("text-[11px]", r.type === "Purchase Order" ? "text-emerald-700" : "text-violet-600")}>{r.type}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", value: (r) => r.type, hidden: true },
    { key: "vendor", header: "Vendor", value: (r) => r.vendor, className: "font-medium text-slate-900" },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "items", header: "Items", value: (r) => r.itemCount, align: "right", format: "number", total: true },
    { key: "subTotal", header: "Taxable Value", value: (r) => r.subTotal, format: "currency", align: "right", total: true },
    { key: "tax", header: "GST", value: (r) => r.tax, format: "currency", align: "right", total: true },
    { key: "total", header: "Total", value: (r) => r.total, format: "currency", align: "right", total: true, className: "font-semibold text-slate-900" },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
  ];

  const total = sumBy(rows, (r) => r.total);
  const poRows = rows.filter((r) => r.type === "Purchase Order");
  const dspRows = rows.filter((r) => r.type === "Direct Purchase");
  const vendorSpend = groupSum(rows, (r) => r.vendor, (r) => r.total, 1);
  const lines = rows.flatMap((r) => r.lines);
  const activeFilterCount = [typeFilter, vendorFilter, departmentFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Purchase Register"
      description="Committed spend across approved purchase orders and direct (spot) purchases."
      loading={orders.loading || dsps.loading}
      error={orders.error || dsps.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "date", dir: "desc" }}
      searchPlaceholder="Search document, vendor or department…"
      stats={[
        { label: "Total Purchases", value: formatCompactMoney(total), sublabel: `${rows.length} documents · GST ${formatCompactMoney(sumBy(rows, (r) => r.tax))}`, icon: IndianRupee, accent: "#059669" },
        { label: "Purchase Orders", value: formatCompactMoney(sumBy(poRows, (r) => r.total)), sublabel: `${poRows.length} POs`, icon: ShoppingCart, accent: "#2563eb" },
        { label: "Direct Purchases", value: formatCompactMoney(sumBy(dspRows, (r) => r.total)), sublabel: `${dspRows.length} spot buys`, icon: Zap, accent: "#7c3aed" },
        {
          label: "Active Vendors",
          value: distinct(rows.map((r) => r.vendor)).length,
          sublabel: vendorSpend[0] ? `Top: ${vendorSpend[0].name}` : "No purchases",
          icon: Users,
          accent: "#d97706",
        },
      ]}
      charts={[
        { title: "Monthly purchase trend", type: "area", valueFormat: "currency", data: monthlySum(rows, (r) => r.date, (r) => r.total) },
        { title: "Spend by vendor", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(rows, (r) => r.vendor, (r) => r.total) },
        { title: "Spend by department", type: "pie", valueFormat: "currency", data: groupSum(rows, (r) => r.department, (r) => r.total, 6) },
        { title: "Spend by category", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(lines, (l) => l.category, (l) => l.amount) },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setTypeFilter("all");
        setVendorFilter("all");
        setDepartmentFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Types" value={typeFilter} onChange={setTypeFilter} options={["Purchase Order", "Direct Purchase"]} allLabel="All purchase types" />
          <ReportFilterSelect label="Vendors" value={vendorFilter} onChange={setVendorFilter} options={distinct(allRows.map((r) => r.vendor))} />
          <ReportFilterSelect label="Departments" value={departmentFilter} onChange={setDepartmentFilter} options={distinct(allRows.map((r) => r.department))} />
        </>
      }
    />
  );
}
