"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReportChartConfig, ReportColumn, ReportRow } from "@/app/data/frontoffice/reports";
import {
  ReportWorkspace,
  WorkspaceFilterSelect,
  exportReportXlsx,
  type WorkspaceKpi,
} from "@/components/reports/ReportWorkspace";
import { usePsItem } from "@/hooks/usePsResource";
import { mntReportsService, type MntReportsData } from "@/services/maintenance";

type MntReportId = "turnaround" | "pm_compliance" | "downtime" | "spare_parts";

const REPORTS: { id: MntReportId; label: string; icon: LucideIcon; description: string; search: string }[] = [
  {
    id: "turnaround",
    label: "WO Turnaround",
    icon: Clock,
    description: "Live work orders with priority, status, assignee, due date and cost.",
    search: "Search WO, location, technician…",
  },
  {
    id: "pm_compliance",
    label: "PM Compliance",
    icon: CheckCircle2,
    description: "Scheduled preventive maintenance tasks with due dates and completion history.",
    search: "Search PM number, asset, task…",
  },
  {
    id: "downtime",
    label: "Room Downtime",
    icon: Building2,
    description: "Guest rooms blocked out of order / out of service, with linked work orders.",
    search: "Search room, reason, work order…",
  },
  {
    id: "spare_parts",
    label: "Spare Parts Spent",
    icon: Boxes,
    description: "Spare parts issued against maintenance work orders.",
    search: "Search part, code, work order…",
  },
];

const COLUMNS: Record<MntReportId, ReportColumn[]> = {
  turnaround: [
    { key: "woNumber", header: "WO #" },
    { key: "location", header: "Location" },
    { key: "category", header: "Category" },
    { key: "priority", header: "Priority" },
    { key: "status", header: "Status" },
    { key: "technician", header: "Technician" },
    { key: "dueDate", header: "Due Date" },
    { key: "totalCost", header: "Total Cost", format: "currency" },
  ],
  pm_compliance: [
    { key: "pmNumber", header: "PM Number" },
    { key: "assetCode", header: "Asset Code" },
    { key: "assetName", header: "Asset" },
    { key: "taskTitle", header: "Task" },
    { key: "frequency", header: "Frequency" },
    { key: "nextDueDate", header: "Next Due" },
    { key: "lastCompletedDate", header: "Last Completed" },
    { key: "status", header: "Status" },
  ],
  downtime: [
    { key: "room", header: "Room" },
    { key: "blockType", header: "Block Type" },
    { key: "workOrderNo", header: "Work Order" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status" },
    { key: "technician", header: "Technician" },
  ],
  spare_parts: [
    { key: "partName", header: "Part Name" },
    { key: "productCode", header: "Product Code" },
    { key: "quantity", header: "Quantity" },
    { key: "totalCost", header: "Total Cost", format: "currency" },
    { key: "woNumber", header: "Work Order" },
  ],
};

const EMPTY_REPORTS: MntReportsData = {
  turnaround: [],
  pmCompliance: [],
  roomDowntime: [],
  spareParts: [],
};

const CLOSED = /completed|verified|closed/i;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const sumOf = (rows: ReportRow[], key: string) => rows.reduce((n, r) => n + (Number(r[key]) || 0), 0);
const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

function countBy(rows: ReportRow[], key: string, fallback = "Unspecified") {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[key] ?? "").trim() || fallback;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

function sumBy(rows: ReportRow[], key: string, valueKey: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[key] ?? "").trim() || "Unspecified";
    map.set(k, (map.get(k) ?? 0) + (Number(r[valueKey]) || 0));
  }
  return [...map].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
}

function toRows(type: MntReportId, list: Record<string, unknown>[]): ReportRow[] {
  return list.map((item, i) => {
    const row: ReportRow = { id: `${type}-${i}` };
    for (const c of COLUMNS[type]) {
      const v = item[c.key];
      row[c.key] = typeof v === "number" ? v : v === null || v === undefined ? "" : String(v);
    }
    if (type === "turnaround" || type === "downtime") row.technician = row.technician || "Unassigned";
    return row;
  });
}

function buildKpis(type: MntReportId, rows: ReportRow[]): WorkspaceKpi[] {
  const n = rows.length;
  switch (type) {
    case "turnaround": {
      const closed = rows.filter((r) => CLOSED.test(String(r.status))).length;
      const urgent = rows.filter((r) => /high|urgent|critical/i.test(String(r.priority)) && !CLOSED.test(String(r.status))).length;
      return [
        { label: "Work orders", value: n, hint: `${closed} closed · ${n - closed} open`, icon: Wrench },
        { label: "Closure rate", value: `${pctOf(closed, n)}%`, hint: "Completed or verified", icon: CheckCircle2 },
        { label: "Open high priority", value: urgent, hint: urgent ? "Needs attention" : "All clear", icon: AlertTriangle },
        { label: "Total cost", value: inr(sumOf(rows, "totalCost")), hint: n ? `Avg ${inr(sumOf(rows, "totalCost") / n)} / WO` : "No work orders", icon: IndianRupee },
      ];
    }
    case "pm_compliance": {
      const due = rows.filter((r) => /due|overdue/i.test(String(r.status))).length;
      const overdue = rows.filter((r) => /overdue/i.test(String(r.status))).length;
      const compliant = rows.filter((r) => /upcoming/i.test(String(r.status)) || Boolean(r.lastCompletedDate)).length;
      return [
        { label: "PM schedules", value: n, hint: `${countBy(rows, "frequency").length} frequencies`, icon: ShieldCheck },
        { label: "Compliance", value: `${pctOf(compliant, n)}%`, hint: `${compliant} on track`, icon: CheckCircle2 },
        { label: "Due / overdue", value: due, hint: `${overdue} overdue`, icon: AlertTriangle },
        { label: "Upcoming", value: rows.filter((r) => /upcoming/i.test(String(r.status))).length, hint: "Not yet due", icon: Clock },
      ];
    }
    case "downtime": {
      const ooo = rows.filter((r) => /ooo/i.test(String(r.blockType))).length;
      const oos = rows.filter((r) => /oos/i.test(String(r.blockType))).length;
      const unassigned = rows.filter((r) => /unassigned/i.test(String(r.technician))).length;
      return [
        { label: "Rooms blocked", value: n, hint: "OOO + OOS", icon: Building2 },
        { label: "Out of order", value: ooo, hint: "Not sellable", icon: AlertTriangle },
        { label: "Out of service", value: oos, hint: "Minor issues", icon: Wrench },
        { label: "Unassigned", value: unassigned, hint: unassigned ? "No technician yet" : "All assigned", icon: Clock },
      ];
    }
    case "spare_parts": {
      const cost = sumOf(rows, "totalCost");
      const top = sumBy(rows, "partName", "totalCost")[0];
      return [
        { label: "Issue lines", value: n, hint: `${countBy(rows, "woNumber").length} work orders`, icon: Boxes },
        { label: "Quantity", value: sumOf(rows, "quantity").toLocaleString("en-IN"), hint: "Units issued", icon: Wrench },
        { label: "Total cost", value: inr(cost), hint: "Parts consumed", icon: IndianRupee },
        { label: "Top part", value: top?.name ?? "—", hint: top ? `${inr(top.value)} · ${pctOf(top.value, cost)}%` : "No parts issued", icon: CheckCircle2 },
      ];
    }
  }
}

function buildCharts(type: MntReportId, rows: ReportRow[]): ReportChartConfig[] {
  switch (type) {
    case "turnaround":
      return [
        { title: "Work orders by status", type: "pie", valueFormat: "number", data: countBy(rows, "status") },
        { title: "By category", type: "bar", layout: "horizontal", valueFormat: "number", data: countBy(rows, "category") },
        { title: "Cost by category", type: "bar", valueFormat: "currency", data: sumBy(rows, "category", "totalCost") },
        { title: "By technician", type: "bar", layout: "horizontal", valueFormat: "number", data: countBy(rows, "technician") },
      ];
    case "pm_compliance":
      return [
        { title: "Schedules by status", type: "pie", valueFormat: "number", data: countBy(rows, "status") },
        { title: "By frequency", type: "bar", valueFormat: "number", data: countBy(rows, "frequency") },
      ];
    case "downtime":
      return [
        { title: "Block type", type: "pie", valueFormat: "number", data: countBy(rows, "blockType") },
        { title: "By reason", type: "bar", layout: "horizontal", valueFormat: "number", data: countBy(rows, "reason") },
      ];
    case "spare_parts":
      return [
        { title: "Cost by part", type: "bar", layout: "horizontal", valueFormat: "currency", data: sumBy(rows, "partName", "totalCost") },
        { title: "Cost by work order", type: "bar", valueFormat: "currency", data: sumBy(rows, "woNumber", "totalCost") },
      ];
  }
}

export function MaintenanceReportsView() {
  const { data, loading, error, reload } = usePsItem(() => mntReportsService.get(), []);
  const reports = data ?? EMPTY_REPORTS;

  const [type, setType] = useState<MntReportId>("turnaround");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const allRows = useMemo(() => {
    const source: Record<MntReportId, unknown[]> = {
      turnaround: reports.turnaround ?? [],
      pm_compliance: reports.pmCompliance ?? [],
      downtime: reports.roomDowntime ?? [],
      spare_parts: reports.spareParts ?? [],
    };
    return toRows(type, source[type] as Record<string, unknown>[]);
  }, [reports, type]);

  const statuses = useMemo(
    () => [...new Set(allRows.map((r) => String(r.status ?? "")).filter(Boolean))].sort(),
    [allRows],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [allRows, search, statusFilter]);

  const report = REPORTS.find((r) => r.id === type) ?? REPORTS[0];
  const columns = COLUMNS[type];

  return (
    <ReportWorkspace
      eyebrow="Maintenance · Reports"
      title={report.label}
      description={report.description}
      reportOptions={REPORTS}
      activeReport={type}
      onReportChange={(id) => {
        setType(id as MntReportId);
        setStatusFilter("all");
      }}
      periodLabel="Live data"
      loading={loading}
      error={error}
      onRefresh={() => void reload()}
      onExport={() =>
        exportReportXlsx(report.label, "Maintenance", columns, rows, [
          ...(statusFilter !== "all" ? ([["Status", statusFilter]] as [string, string][]) : []),
          ...(search.trim() ? ([["Search", search.trim()]] as [string, string][]) : []),
        ])
      }
      kpis={buildKpis(type, rows)}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={report.search}
      filters={
        statuses.length ? (
          <WorkspaceFilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All statuses"
            options={statuses}
          />
        ) : null
      }
      filtersActive={statusFilter !== "all"}
      onClearFilters={() => setStatusFilter("all")}
      columns={columns}
      rows={rows}
      totalRows={allRows.length}
      charts={buildCharts(type, rows)}
    />
  );
}
