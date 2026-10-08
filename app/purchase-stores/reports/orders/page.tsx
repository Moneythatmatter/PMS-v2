"use client";

import { useMemo, useState } from "react";
import { AlarmClock, FileStack, Gauge, IndianRupee } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import { psGrnService, psPurchaseOrderService } from "@/services/purchase-stores/index";
import { normalizeGrnRecord } from "@/app/data/grnData";
import {
  PsReportView,
  ReportFilterSelect,
  ReportProgress,
  ReportStatusPill,
  distinct,
  formatCompactMoney,
  formatReportDate,
  groupSum,
  monthlySum,
  sumBy,
  useReportPeriod,
  type ReportColumn,
} from "@/components/purchase-stores/reports/PsReportView";

type DeliveryStatus = "Delivered" | "Partially Received" | "Overdue" | "Awaiting Delivery" | "Cancelled" | "Not Issued";

type OrderRow = {
  id: string;
  poNumber: string;
  orderDate: string;
  vendor: string;
  department: string;
  buyer: string;
  linkedPR: string;
  expectedDate: string;
  itemCount: number;
  orderedQty: number;
  receivedQty: number;
  receivedPct: number;
  value: number;
  status: string;
  delivery: DeliveryStatus;
  daysLate: number;
};

const DELIVERY_OPTIONS: DeliveryStatus[] = ["Overdue", "Awaiting Delivery", "Partially Received", "Delivered", "Not Issued", "Cancelled"];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PurchaseOrdersReportPage() {
  const period = useReportPeriod("fy");
  const orders = usePsList(() => psPurchaseOrderService.list(), []);
  const grns = usePsList(() => psGrnService.list(), []);

  const [vendorFilter, setVendorFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  const allRows = useMemo<OrderRow[]>(() => {
    const today = todayIso();
    const receivedByPo = new Map<string, number>();
    for (const grn of grns.data) {
      const received = sumBy(normalizeGrnRecord(grn).items, (i) => i.receivedQty);
      receivedByPo.set(grn.poNumber, (receivedByPo.get(grn.poNumber) ?? 0) + received);
    }

    return orders.data
      .filter((po) => period.inPeriod(po.orderDate))
      .map((po) => {
        const orderedQty = sumBy(po.items ?? [], (i) => i.quantity);
        const receivedQty = receivedByPo.get(po.poNumber) ?? 0;
        const receivedPct = orderedQty > 0 ? Math.min(100, (receivedQty / orderedQty) * 100) : 0;
        const expected = String(po.expectedDeliveryDate ?? "").slice(0, 10);
        const late = expected && expected < today;
        let delivery: DeliveryStatus;
        if (/cancel/i.test(po.status)) delivery = "Cancelled";
        else if (orderedQty > 0 && receivedQty >= orderedQty) delivery = "Delivered";
        else if (/draft|pending/i.test(po.status)) delivery = "Not Issued";
        else if (late) delivery = "Overdue";
        else if (receivedQty > 0) delivery = "Partially Received";
        else delivery = "Awaiting Delivery";
        const daysLate =
          delivery === "Overdue" ? Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${expected}T00:00:00`).getTime()) / 86_400_000) : 0;
        return {
          id: po.id,
          poNumber: po.poNumber,
          orderDate: po.orderDate,
          vendor: po.vendorName,
          department: po.department,
          buyer: po.buyerName,
          linkedPR: po.linkedPR ?? "",
          expectedDate: expected,
          itemCount: po.items?.length ?? 0,
          orderedQty,
          receivedQty,
          receivedPct,
          value: Number(po.totalAmount) || 0,
          status: po.status,
          delivery,
          daysLate,
        };
      });
  }, [orders.data, grns.data, period]);

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (vendorFilter === "all" || r.vendor === vendorFilter) &&
          (departmentFilter === "all" || r.department === departmentFilter) &&
          (statusFilter === "all" || r.status === statusFilter) &&
          (deliveryFilter === "all" || r.delivery === deliveryFilter),
      ),
    [allRows, vendorFilter, departmentFilter, statusFilter, deliveryFilter],
  );

  const columns: ReportColumn<OrderRow>[] = [
    {
      key: "poNumber",
      header: "PO Number",
      value: (r) => r.poNumber,
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-slate-900">{r.poNumber}</p>
          {r.linkedPR && <p className="font-mono text-[11px] text-emerald-700">{r.linkedPR}</p>}
        </div>
      ),
    },
    { key: "linkedPR", header: "Linked PR", value: (r) => r.linkedPR, hidden: true },
    { key: "orderDate", header: "PO Date", value: (r) => r.orderDate, format: "date" },
    {
      key: "vendor",
      header: "Vendor",
      value: (r) => r.vendor,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.vendor || "—"}</p>
          <p className="text-[11px] text-slate-400">{r.department}</p>
        </div>
      ),
    },
    { key: "department", header: "Department", value: (r) => r.department, hidden: true },
    { key: "buyer", header: "Buyer", value: (r) => r.buyer },
    {
      key: "expectedDate",
      header: "Expected",
      value: (r) => r.expectedDate,
      render: (r) => (
        <div>
          <p>{formatReportDate(r.expectedDate)}</p>
          {r.daysLate > 0 && <p className="text-[11px] font-medium text-red-600">{r.daysLate}d late</p>}
        </div>
      ),
    },
    { key: "items", header: "Lines", value: (r) => r.itemCount, format: "number", align: "right", total: true },
    { key: "orderedQty", header: "Ordered", value: (r) => r.orderedQty, format: "number", align: "right", total: true },
    { key: "receivedQty", header: "Received", value: (r) => r.receivedQty, format: "number", align: "right", total: true },
    {
      key: "receivedPct",
      header: "Fulfilment",
      value: (r) => Math.round(r.receivedPct),
      render: (r) => <ReportProgress value={r.receivedPct} tone={r.receivedPct >= 100 ? "emerald" : r.delivery === "Overdue" ? "red" : "amber"} />,
    },
    { key: "value", header: "PO Value", value: (r) => r.value, format: "currency", align: "right", total: true, className: "font-semibold text-slate-900" },
    { key: "status", header: "PO Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
    { key: "delivery", header: "Delivery", value: (r) => r.delivery, render: (r) => <ReportStatusPill status={r.delivery} /> },
  ];

  const live = rows.filter((r) => r.delivery !== "Cancelled");
  const open = live.filter((r) => r.delivery !== "Delivered" && !/closed/i.test(r.status));
  const overdue = rows.filter((r) => r.delivery === "Overdue");
  const ordered = sumBy(live, (r) => r.orderedQty);
  const received = sumBy(live, (r) => Math.min(r.receivedQty, r.orderedQty));
  const activeFilterCount = [vendorFilter, departmentFilter, statusFilter, deliveryFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Purchase Order Status"
      description="Every PO raised in the period with delivery progress against GRNs, overdue tracking and open commitments."
      loading={orders.loading || grns.loading}
      error={orders.error || grns.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "orderDate", dir: "desc" }}
      searchPlaceholder="Search PO, vendor, buyer, PR…"
      rowClassName={(r) => (r.delivery === "Overdue" ? "bg-red-50/40" : undefined)}
      stats={[
        { label: "POs Raised", value: formatCompactMoney(sumBy(live, (r) => r.value)), sublabel: `${live.length} purchase orders`, icon: FileStack, accent: "#2563eb" },
        { label: "Open Commitments", value: formatCompactMoney(sumBy(open, (r) => r.value)), sublabel: `${open.length} POs not fully received`, icon: IndianRupee, accent: "#059669" },
        { label: "Overdue Deliveries", value: overdue.length, sublabel: overdue.length ? `${formatCompactMoney(sumBy(overdue, (r) => r.value))} at risk` : "All on schedule", icon: AlarmClock, accent: "#dc2626" },
        { label: "Fulfilment Rate", value: `${ordered ? Math.round((received / ordered) * 100) : 0}%`, sublabel: "Units received vs ordered", icon: Gauge, accent: "#7c3aed" },
      ]}
      charts={[
        {
          title: "Delivery status",
          type: "pie",
          valueFormat: "number",
          data: DELIVERY_OPTIONS.map((s, i) => ({
            name: s,
            value: rows.filter((r) => r.delivery === s).length,
            color: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#94a3b8", "#cbd5e1"][i],
          })).filter((d) => d.value > 0),
        },
        { title: "PO value by vendor", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(live, (r) => r.vendor, (r) => r.value) },
        { title: "Monthly PO value", type: "area", valueFormat: "currency", data: monthlySum(live, (r) => r.orderDate, (r) => r.value) },
        { title: "PO value by department", type: "pie", valueFormat: "currency", data: groupSum(live, (r) => r.department, (r) => r.value, 6) },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setVendorFilter("all");
        setDepartmentFilter("all");
        setStatusFilter("all");
        setDeliveryFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Vendors" value={vendorFilter} onChange={setVendorFilter} options={distinct(allRows.map((r) => r.vendor))} />
          <ReportFilterSelect label="Departments" value={departmentFilter} onChange={setDepartmentFilter} options={distinct(allRows.map((r) => r.department))} />
          <ReportFilterSelect label="PO status" value={statusFilter} onChange={setStatusFilter} options={distinct(allRows.map((r) => r.status))} allLabel="All PO statuses" />
          <ReportFilterSelect label="Delivery" value={deliveryFilter} onChange={setDeliveryFilter} options={DELIVERY_OPTIONS} allLabel="All deliveries" />
        </>
      }
    />
  );
}
