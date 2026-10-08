"use client";

import { useMemo, useState } from "react";
import { Building2, Clock, IndianRupee, PackageOpen } from "lucide-react";
import { usePsList } from "@/hooks/usePsResource";
import { psStockIssueService } from "@/services/purchase-stores/index";
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

type IssueRow = {
  id: string;
  date: string;
  issueNo: string;
  department: string;
  warehouse: string;
  store: string;
  requestedBy: string;
  issuedBy: string;
  purpose: string;
  itemCount: number;
  requestedQty: number;
  issuedQty: number;
  value: number;
  status: string;
  lines: { item: string; value: number }[];
};

const isConsumed = (status: string) => /^issued$|partially issued/i.test(status);

export default function IssuesReportPage() {
  const period = useReportPeriod("fy");
  const issues = usePsList(() => psStockIssueService.list(), []);

  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRows = useMemo<IssueRow[]>(
    () =>
      issues.data
        .filter((i) => period.inPeriod(i.issueDate))
        .map((i) => {
          const lines = i.lineItems ?? [];
          const lineValue = sumBy(lines, (l) => (Number(l.issuedQty) || 0) * (Number(l.unitCost) || 0));
          return {
            id: i.id,
            date: i.issueDate,
            issueNo: i.issueNo,
            department: i.department,
            warehouse: i.warehouse,
            store: i.store,
            requestedBy: i.requestedBy,
            issuedBy: i.issuedBy ?? "",
            purpose: i.purpose,
            itemCount: lines.length,
            requestedQty: sumBy(lines, (l) => l.requestedQty),
            issuedQty: sumBy(lines, (l) => l.issuedQty),
            value: Number(i.totalValue) || lineValue,
            status: i.status,
            lines: lines.map((l) => ({ item: l.itemName, value: (Number(l.issuedQty) || 0) * (Number(l.unitCost) || 0) })),
          };
        }),
    [issues.data, period],
  );

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (departmentFilter === "all" || r.department === departmentFilter) &&
          (warehouseFilter === "all" || r.warehouse === warehouseFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [allRows, departmentFilter, warehouseFilter, statusFilter],
  );

  const columns: ReportColumn<IssueRow>[] = [
    { key: "date", header: "Date", value: (r) => r.date, format: "date" },
    { key: "issueNo", header: "Issue No.", value: (r) => r.issueNo, className: "font-mono text-xs font-semibold text-slate-900" },
    {
      key: "department",
      header: "Department",
      value: (r) => r.department,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.department || "—"}</p>
          {r.purpose && <p className="max-w-[16rem] truncate text-[11px] text-slate-400">{r.purpose}</p>}
        </div>
      ),
    },
    { key: "purpose", header: "Purpose", value: (r) => r.purpose, hidden: true },
    {
      key: "warehouse",
      header: "Issued From",
      value: (r) => r.warehouse,
      render: (r) => (
        <div>
          <p>{r.warehouse || "—"}</p>
          {r.store && <p className="text-[11px] text-slate-400">{r.store}</p>}
        </div>
      ),
    },
    { key: "requestedBy", header: "Requested By", value: (r) => r.requestedBy },
    { key: "items", header: "Items", value: (r) => r.itemCount, format: "number", align: "right", total: true },
    { key: "requestedQty", header: "Req. Qty", value: (r) => r.requestedQty, format: "number", align: "right", total: true },
    {
      key: "issuedQty",
      header: "Issued Qty",
      value: (r) => r.issuedQty,
      format: "number",
      align: "right",
      total: true,
      className: "font-medium text-slate-900",
    },
    { key: "value", header: "Value", value: (r) => r.value, format: "currency", align: "right", total: true, className: "font-semibold text-slate-900" },
    { key: "status", header: "Status", value: (r) => r.status, render: (r) => <ReportStatusPill status={r.status} /> },
  ];

  const consumed = rows.filter((r) => isConsumed(r.status));
  const byDept = groupSum(consumed, (r) => r.department, (r) => r.value);
  const pending = rows.filter((r) => /pending|draft/i.test(r.status)).length;
  const activeFilterCount = [departmentFilter, warehouseFilter, statusFilter].filter((f) => f !== "all").length;

  return (
    <PsReportView
      title="Issue Register"
      description="Stock issued to departments — consumption by department, store and item."
      loading={issues.loading}
      error={issues.error}
      period={period}
      rows={rows}
      columns={columns}
      defaultSort={{ key: "date", dir: "desc" }}
      searchPlaceholder="Search issue no., department, requester…"
      stats={[
        { label: "Consumption Value", value: formatCompactMoney(sumBy(consumed, (r) => r.value)), sublabel: `${consumed.length} issued documents`, icon: IndianRupee, accent: "#059669" },
        { label: "Units Issued", value: sumBy(consumed, (r) => r.issuedQty).toLocaleString("en-IN"), sublabel: `of ${sumBy(rows, (r) => r.requestedQty).toLocaleString("en-IN")} requested`, icon: PackageOpen, accent: "#2563eb" },
        { label: "Top Consumer", value: byDept[0]?.name ?? "—", sublabel: byDept[0] ? formatCompactMoney(byDept[0].value) : "No issues", icon: Building2, accent: "#7c3aed" },
        { label: "Awaiting Issue", value: pending, sublabel: "Draft or pending approval", icon: Clock, accent: "#d97706" },
      ]}
      charts={[
        { title: "Consumption by department", type: "bar", layout: "horizontal", valueFormat: "currency", data: byDept },
        { title: "Monthly consumption", type: "area", valueFormat: "currency", data: monthlySum(consumed, (r) => r.date, (r) => r.value) },
        { title: "Top items issued (value)", type: "bar", layout: "horizontal", valueFormat: "currency", data: groupSum(consumed.flatMap((r) => r.lines), (l) => l.item, (l) => l.value, 10).filter((d) => d.name !== "Others") },
        { title: "Issues by status", type: "pie", valueFormat: "number", data: groupSum(rows, (r) => r.status, () => 1) },
      ]}
      activeFilterCount={activeFilterCount}
      onResetFilters={() => {
        setDepartmentFilter("all");
        setWarehouseFilter("all");
        setStatusFilter("all");
      }}
      filters={
        <>
          <ReportFilterSelect label="Departments" value={departmentFilter} onChange={setDepartmentFilter} options={distinct(allRows.map((r) => r.department))} />
          <ReportFilterSelect label="Warehouses" value={warehouseFilter} onChange={setWarehouseFilter} options={distinct(allRows.map((r) => r.warehouse))} />
          <ReportFilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={distinct(allRows.map((r) => r.status))} allLabel="All statuses" />
        </>
      }
    />
  );
}
