"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  Download,
  Globe,
  LogOut,
  Percent,
  Receipt,
  RotateCcw,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReportDefinition, ReportRow } from "@/app/data/frontoffice/reports";
import { reportDefinitions, reportStatusClass } from "@/app/data/frontoffice/reports";
import { Button } from "@/components/ui/Button";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FOSearchToolbar } from "@/components/frontoffice/ui/FOSearchToolbar";
import {
  FOPageHeader,
  FormField,
  SelectInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

const REPORT_STAT_ICONS: Record<string, LucideIcon[]> = {
  arrival: [CalendarCheck, CheckCircle2, BedDouble, Star],
  departure: [LogOut, CheckCircle2, AlertCircle, Wallet],
  occupancy: [BedDouble, DoorOpen, Wrench, TrendingUp],
  revenue: [TrendingUp, BedDouble, UtensilsCrossed, Receipt],
  cashier: [Wallet, Banknote, CreditCard, RotateCcw],
  "night-audit": [Clock, Receipt, AlertTriangle, CheckCircle2],
  guest: [Users, Globe, Globe, UserCheck],
  room: [DoorOpen, BedDouble, CheckCircle2, AlertTriangle],
  tax: [Receipt, Percent, Percent, Wallet],
};

function formatCell(value: string | number | undefined, format?: "currency" | "percent") {
  if (value === undefined || value === "—") return "—";
  if (format === "currency" && typeof value === "number") return formatINR(value);
  if (format === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

function filterRow(row: ReportRow, filter: string, definition: ReportDefinition) {
  if (filter === "all") return true;
  if (row.status === filter) return true;
  if (row.band === filter) return true;
  if (row.group === filter) return true;
  if (row.shift === filter) return true;
  if (filter === "High" && typeof row.occupancy === "number" && row.occupancy > 70) return true;
  if (filter === "Medium" && typeof row.occupancy === "number" && row.occupancy >= 40 && row.occupancy <= 70) return true;
  if (filter === "Low" && typeof row.occupancy === "number" && row.occupancy < 40) return true;
  if (filter === "Indian" && row.nationality === "Indian") return true;
  if (filter === "International" && row.nationality && row.nationality !== "Indian") return true;
  if (filter === "Corporate" && row.segment === "Corporate") return true;
  if (filter === "Dirty" && (row.housekeeping === "Dirty" || row.status === "Dirty")) return true;
  if (filter === "Exception" && row.status === "Exception") return true;
  return false;
}

function sortRows(rows: ReportRow[], sortBy: string): ReportRow[] {
  const copy = [...rows];
  switch (sortBy) {
    case "guest":
      return copy.sort((a, b) => String(a.guestName ?? "").localeCompare(String(b.guestName ?? "")));
    case "room":
      return copy.sort((a, b) => String(a.roomNo ?? "").localeCompare(String(b.roomNo ?? ""), undefined, { numeric: true }));
    case "time":
      return copy.sort((a, b) => String(a.eta ?? "").localeCompare(String(b.eta ?? "")));
    case "balance-desc":
      return copy.sort((a, b) => Number(b.balance ?? 0) - Number(a.balance ?? 0));
    case "checkout":
      return copy.sort((a, b) => String(a.checkOutTime ?? "").localeCompare(String(b.checkOutTime ?? "")));
    case "occupancy-desc":
      return copy.sort((a, b) => Number(b.occupancy ?? 0) - Number(a.occupancy ?? 0));
    case "type":
      return copy.sort((a, b) => String(a.roomType ?? "").localeCompare(String(b.roomType ?? "")));
    case "amount-desc":
      return copy.sort((a, b) => Number(b.amount ?? b.collected ?? 0) - Number(a.amount ?? a.collected ?? 0));
    case "category":
      return copy.sort((a, b) => String(a.category ?? "").localeCompare(String(b.category ?? "")));
    case "cashier":
      return copy.sort((a, b) => String(a.cashier ?? "").localeCompare(String(b.cashier ?? "")));
    case "stays-desc":
      return copy.sort((a, b) => Number(b.totalStays ?? 0) - Number(a.totalStays ?? 0));
    case "revenue-desc":
      return copy.sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0));
    case "floor":
      return copy.sort((a, b) => String(a.floor ?? "").localeCompare(String(b.floor ?? "")));
    case "tax-desc":
      return copy.sort((a, b) => Number(b.totalTax ?? 0) - Number(a.totalTax ?? 0));
    default:
      return copy;
  }
}

function exportCsv(definition: ReportDefinition, rows: ReportRow[]) {
  const headers = definition.columns.map((c) => c.header);
  const lines = rows.map((row) =>
    definition.columns
      .map((col) => {
        const raw = row[col.key];
        const formatted = formatCell(raw, col.format);
        return `"${String(formatted).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${definition.id}-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportTable({
  definition,
  rows,
  onRowClick,
}: {
  definition: ReportDefinition;
  rows: ReportRow[];
  onRowClick: (row: ReportRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No records match your search or filters.
      </p>
    );
  }

  const primaryKey = definition.columns[0]?.key ?? "id";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onRowClick(row)}
            className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-slate-200 hover:bg-slate-50/50"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-slate-900">{formatCell(row[primaryKey])}</span>
              {row.status && (
                <Pill className={reportStatusClass(String(row.status))}>{row.status}</Pill>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
              {definition.columns.slice(1, 4).map((col) => (
                <div key={col.key}>
                  <span className="text-slate-400">{col.header}: </span>
                  {formatCell(row[col.key], col.format)}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              {definition.columns.map((col) => (
                <th key={col.key} className="pb-3 pr-4 last:pr-0">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
              >
                {definition.columns.map((col, idx) => (
                  <td key={col.key} className="py-3.5 pr-4 last:pr-0">
                    {col.key === "status" && row.status ? (
                      <Pill className={reportStatusClass(String(row.status))}>{row.status}</Pill>
                    ) : col.key === "housekeeping" && row.housekeeping ? (
                      <Pill
                        className={cn(
                          row.housekeeping === "Clean" || row.housekeeping === "Inspected"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.housekeeping === "Dirty"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {row.housekeeping}
                      </Pill>
                    ) : (
                      <span className={cn(idx === 0 && "font-medium text-slate-900")}>
                        {formatCell(row[col.key], col.format)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportListView({ definition }: { definition: ReportDefinition }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState(definition.sortOptions[0]?.value ?? "guest");
  const [preview, setPreview] = useState<ReportRow | null>(null);
  const icons = REPORT_STAT_ICONS[definition.id] ?? [Receipt, Receipt, Receipt, Receipt];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = definition.rows.filter((row) => filterRow(row, statusFilter, definition));
    if (q) {
      list = list.filter((row) =>
        Object.values(row).some((v) => v !== undefined && String(v).toLowerCase().includes(q)),
      );
    }
    return sortRows(list, sortBy);
  }, [definition, search, statusFilter, sortBy]);

  const previewFields = useMemo(() => {
    if (!preview) return [];
    const columnKeys = new Set(definition.columns.map((c) => c.key));
    const extraKeys = Object.keys(preview).filter(
      (k) => !columnKeys.has(k) && k !== "id" && preview[k] !== undefined,
    );
    const fields = [
      ...definition.columns.map((col) => ({
        label: col.header,
        value: formatCell(preview[col.key], col.format),
      })),
      ...extraKeys.map((key) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value: formatCell(preview[key]),
      })),
    ];
    return fields;
  }, [preview, definition.columns]);

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office · Reports"
        title={definition.title}
        description={definition.description}
        action={
          <Button size="sm" variant="outline" onClick={() => exportCsv(definition, filtered)}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {definition.stats.map((stat, i) => (
          <StatMiniCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            accent={stat.accent}
            sublabel={stat.sublabel}
            icon={icons[i]}
          />
        ))}
      </div>

      {definition.charts.length > 0 && <ReportCharts charts={definition.charts} />}

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={definition.searchPlaceholder}
        filterPills={
          definition.filterOptions
            ? {
                active: statusFilter,
                onChange: setStatusFilter,
                options: definition.filterOptions,
              }
            : undefined
        }
        hasActiveAdvancedFilters={sortBy !== definition.sortOptions[0]?.value}
        onClearAdvancedFilters={() => setSortBy(definition.sortOptions[0]?.value ?? "guest")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Sort by">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {definition.sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{filtered.length}</span> of{" "}
            {definition.rows.length} records
          </p>
        </div>
        <ReportTable definition={definition} rows={filtered} onRowClick={setPreview} />
      </div>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? String(preview.guestName ?? preview.roomNo ?? preview.category ?? preview.cashier ?? "Record") : ""}
        description={definition.title}
        width="md"
      >
        {preview && (
          <dl className="space-y-3">
            {previewFields.map((field) => (
              <div key={field.label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                <dt className="text-sm text-slate-500">{field.label}</dt>
                <dd className="text-right text-sm font-medium text-slate-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>
    </div>
  );
}

export function DailyArrivalReportView() {
  return <ReportListView definition={reportDefinitions.arrival} />;
}

export function DepartureReportView() {
  return <ReportListView definition={reportDefinitions.departure} />;
}

export function OccupancyReportView() {
  return <ReportListView definition={reportDefinitions.occupancy} />;
}

export function RevenueReportView() {
  return <ReportListView definition={reportDefinitions.revenue} />;
}

export function CashierReportView() {
  return <ReportListView definition={reportDefinitions.cashier} />;
}

export function NightAuditReportView() {
  return <ReportListView definition={reportDefinitions["night-audit"]} />;
}

export function GuestReportView() {
  return <ReportListView definition={reportDefinitions.guest} />;
}

export function RoomReportView() {
  return <ReportListView definition={reportDefinitions.room} />;
}

export function TaxReportView() {
  return <ReportListView definition={reportDefinitions.tax} />;
}
