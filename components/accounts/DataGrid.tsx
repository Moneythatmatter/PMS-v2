"use client";

import React, { useState } from "react";
import { GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type GridColumn<T> = {
  id: string;
  label: string;
  width: number;
  minWidth?: number;
  align?: "left" | "right" | "center";
  cell: (row: T, index: number) => React.ReactNode;
  cellClass?: (row: T) => string | undefined;
  title?: (row: T) => string | undefined;
  footer?: React.ReactNode;
};

/** Non-data row rendered above the data rows (e.g. an opening balance); cells keyed by column id. */
export type GridPinnedRow = {
  key: string;
  cells: Record<string, React.ReactNode>;
  className?: string;
};

const ROW_NO_WIDTH = 44;
const cellBase = "border border-slate-200 px-2 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis";
const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

function setResizeCursor(active: boolean) {
  document.body.style.cursor = active ? "col-resize" : "";
  document.body.style.userSelect = active ? "none" : "";
}

/** Spreadsheet-style table: drag a header's right edge to resize, drag a header onto another to reorder. */
export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  pinnedRows,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pinnedRows?: GridPinnedRow[];
}) {
  const defaultOrder = columns.map((c) => c.id);
  const defaultWidths = Object.fromEntries(columns.map((c) => [c.id, c.width]));
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [widths, setWidths] = useState<Record<string, number>>(defaultWidths);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const byId = new Map(columns.map((c) => [c.id, c]));
  const ordered = [
    ...order.filter((id) => byId.has(id)),
    ...columns.map((c) => c.id).filter((id) => !order.includes(id)),
  ].map((id) => byId.get(id)!);
  const widthOf = (c: GridColumn<T>) => widths[c.id] ?? c.width;
  const tableWidth = ROW_NO_WIDTH + ordered.reduce((sum, c) => sum + widthOf(c), 0);
  const hasFooter = ordered.some((c) => c.footer !== undefined);
  const customized =
    order.join("|") !== defaultOrder.join("|") || columns.some((c) => widthOf(c) !== c.width);

  const startResize = (e: React.PointerEvent, col: GridColumn<T>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widthOf(col);
    const min = col.minWidth ?? 60;
    const move = (ev: PointerEvent) =>
      setWidths((w) => ({ ...w, [col.id]: Math.max(min, Math.round(startWidth + ev.clientX - startX)) }));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setResizeCursor(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    setResizeCursor(true);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrder(() => {
      const ids = ordered.map((c) => c.id).filter((id) => id !== dragId);
      ids.splice(ids.indexOf(targetId), 0, dragId);
      return ids;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
        <span>Drag a column edge to resize · drag a header to move it · double-click an edge to reset width</span>
        {customized && (
          <button
            type="button"
            onClick={() => {
              setOrder(defaultOrder);
              setWidths(defaultWidths);
            }}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-3 w-3" /> Reset columns
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="table-fixed border-collapse text-left text-xs" style={{ width: tableWidth, minWidth: "100%" }}>
          <colgroup>
            <col style={{ width: ROW_NO_WIDTH }} />
            {ordered.map((c) => (
              <col key={c.id} style={{ width: widthOf(c) }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-100 text-[11px] font-semibold text-slate-700">
              <th className={cn(cellBase, "bg-slate-200/70 text-center text-slate-500")}>#</th>
              {ordered.map((c) => (
                <th
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(c.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", c.id);
                  }}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    if (overId !== c.id) setOverId(c.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropOn(c.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={cn(
                    cellBase,
                    "group/th relative cursor-grab select-none active:cursor-grabbing",
                    alignClass[c.align ?? "left"],
                    dragId === c.id && "opacity-40",
                    overId === c.id && dragId !== c.id && "bg-sky-100 shadow-[inset_3px_0_0_0_#0284c7]",
                  )}
                  title={`${c.label} — drag to move`}
                >
                  <span className="inline-flex max-w-full items-center gap-1">
                    <GripVertical className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover/th:opacity-100" />
                    <span className="truncate">{c.label}</span>
                  </span>
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${c.label}`}
                    draggable
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => startResize(e, c)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setWidths((w) => ({ ...w, [c.id]: c.width }));
                    }}
                    className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-sky-400/60"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {pinnedRows?.map((p) => (
              <tr key={p.key} className={cn("font-semibold text-slate-800", p.className)}>
                <td className={cn(cellBase, "bg-slate-50")} />
                {ordered.map((c) => (
                  <td key={c.id} className={cn(cellBase, alignClass[c.align ?? "left"])}>
                    {p.cells[c.id]}
                  </td>
                ))}
              </tr>
            ))}
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "group text-slate-800",
                  onRowClick && "cursor-pointer hover:bg-sky-50 focus:bg-sky-100 focus:outline-none",
                )}
              >
                <td className={cn(cellBase, "bg-slate-50 text-center text-[11px] text-slate-400 group-hover:bg-sky-100")}>
                  {idx + 1}
                </td>
                {ordered.map((c) => (
                  <td
                    key={c.id}
                    className={cn(cellBase, alignClass[c.align ?? "left"], c.cellClass?.(row))}
                    title={c.title?.(row)}
                  >
                    {c.cell(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hasFooter && (
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className={cn(cellBase, "bg-slate-200/70")} />
                {ordered.map((c) => (
                  <td key={c.id} className={cn(cellBase, alignClass[c.align ?? "left"])}>
                    {c.footer}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
