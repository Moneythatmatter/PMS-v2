"use client";

import type { ModuleColumn, ModuleRow, ModuleStatusStyle } from "./module-types";
import { ModuleStatusPill } from "./ModuleStatusPill";
import { cn } from "@/lib/utils";
import { formatINR } from "@/components/frontoffice/ui";

function formatCell(value: string | number | undefined, format?: "currency" | "percent") {
  if (value === undefined || value === "—") return "—";
  if (format === "currency" && typeof value === "number") return formatINR(value);
  if (format === "percent" && typeof value === "number") return `${value}%`;
  return String(value);
}

function rowKey(row: ModuleRow, index: number): string {
  const candidates = [
    row.id,
    row.bookingId,
    row.invoiceNo,
    row.room,
    row.roomNo,
    row.metric,
    row.guest,
  ];
  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      return `${String(value)}-${index}`;
    }
  }
  return `row-${index}`;
}

export function ModuleDataTable({
  columns,
  rows,
  onRowClick,
  statusStyle = "pill",
  statusMap,
  emptyMessage = "No records match your search or filters.",
  actionColumn,
}: {
  columns: ModuleColumn[];
  rows: ModuleRow[];
  onRowClick?: (row: ModuleRow) => void;
  statusStyle?: ModuleStatusStyle;
  statusMap?: Record<string, string>;
  emptyMessage?: string;
  actionColumn?: (row: ModuleRow) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  const primaryKey = columns[0]?.key ?? "id";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={rowKey(row, index)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (!onRowClick) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(row);
              }
            }}
            className={cn(
              "w-full rounded-xl border border-slate-100 p-4 text-left transition-colors",
              onRowClick && "cursor-pointer hover:border-slate-200 hover:bg-slate-50/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-slate-900">
                {formatCell(row[primaryKey], columns[0]?.format)}
              </span>
              {row.status && (
                <ModuleStatusPill status={String(row.status)} style={statusStyle} statusMap={statusMap} />
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
              {columns.slice(1, 4).map((col) => (
                <div key={col.key}>
                  <span className="text-slate-400">{col.header}: </span>
                  {formatCell(row[col.key], col.format)}
                </div>
              ))}
            </div>
            {actionColumn && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                {actionColumn(row)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="pb-3 pr-4 last:pr-0">
                  {col.header}
                </th>
              ))}
              {actionColumn && <th className="pb-3 pr-0">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-slate-50 transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-slate-50/80",
                )}
              >
                {columns.map((col, idx) => (
                  <td key={col.key} className="py-3.5 pr-4 last:pr-0">
                    {col.key === "status" && row.status ? (
                      <ModuleStatusPill
                        status={String(row.status)}
                        style={statusStyle}
                        statusMap={statusMap}
                      />
                    ) : (
                      <span className={cn(idx === 0 && "font-medium text-slate-900")}>
                        {formatCell(row[col.key], col.format)}
                      </span>
                    )}
                  </td>
                ))}
                {actionColumn && (
                  <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                    {actionColumn(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
